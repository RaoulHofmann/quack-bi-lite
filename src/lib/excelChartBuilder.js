import JSZip from 'jszip'

export function addNativeChartToWorkbook(workbook, chartConfig) {
  const { ws, chartType, title, dataRange, data, sheetName } = chartConfig
  if (!data || !data.length || data.length < 2) return

  const wsName = ws.name || 'Sheet1'
  const chartIndex = workbook._charts ? workbook._charts.length + 1 : 1
  if (!workbook._charts) workbook._charts = []
  if (!workbook._chartData) workbook._chartData = []
  workbook._charts.push(chartConfig)
}

export async function injectChartXml(workbook, chartConfigs) {
  if (!chartConfigs.length) return

  const xlsxData = await workbook.xlsx.writeBuffer()
  const zip = new JSZip()
  await zip.loadAsync(xlsxData)

  const chartTypeMap = {
    bar: 'barClustered',
    line: 'line',
    pie: 'pie',
    doughnut: 'doughnut',
    polarArea: 'radar',
    radar: 'radar',
  }

  for (let ci = 0; ci < chartConfigs.length; ci++) {
    const cfg = chartConfigs[ci]
    const { ws, data, title, chartType, dataRange } = cfg
    if (!data || data.length < 2) continue

    const wsName = ws.name
    const sheetRels = `xl/worksheets/_rels/sheet${ws.index}.xml.rels`
    const drawingId = ci + 1
    const chartId = ci + 1

    const dataHeaders = data[0]
    const dataRows = data.slice(1)
    const numCols = dataHeaders.length

    const catColLetter = 'A'
    const valColLetter = numCols > 1 ? 'B' : 'A'
    const dataStartRow = dataRange ? parseInt(dataRange.match(/\d+/)?.[0] || '1') : 1
    const dataEndRow = dataStartRow + dataRows.length - 1

    const chartXml = buildChartXml({
      title: title || 'Chart',
      chartType: chartTypeMap[chartType] || 'barClustered',
      catRef: `'${wsName}'!$${catColLetter}$${dataStartRow}:$${catColLetter}$${dataEndRow}`,
      valRef: numCols > 1 ? `'${wsName}'!$${valColLetter}$${dataStartRow}:$${valColLetter}$${dataEndRow}` : '',
      seriesName: numCols > 1 ? (dataHeaders[1] || 'Values') : (dataHeaders[0] || 'Values'),
      catTitle: dataHeaders[0] || '',
      valTitle: numCols > 1 ? dataHeaders[1] : 'Values',
    })

    const chartEntry = `xl/charts/chart${chartId}.xml`
    zip.file(chartEntry, chartXml)

    const drawingXml = buildDrawingXml({ chartId, chartEntry })
    const drawingEntry = `xl/drawings/drawing${drawingId}.xml`
    zip.file(drawingEntry, drawingXml)

    const drawingRelsXml = buildDrawingRelsXml({ chartEntry })
    zip.file(`xl/drawings/_rels/drawing${drawingId}.xml.rels`, drawingRelsXml)

    const wsXmlStr = await zip.file(`xl/worksheets/sheet${ws.index}.xml`).async('string')
    const updatedWsXml = injectDrawingRef(wsXmlStr, drawingId)
    zip.file(`xl/worksheets/sheet${ws.index}.xml`, updatedWsXml)

    let relsXml = await zip.file(sheetRels).async('string')
    relsXml = injectDrawingRel(relsXml, drawingId)
    zip.file(sheetRels, relsXml)

    const ctXml = await zip.file('[Content_Types].xml').async('string')
    let updatedCt = injectContentTypes(ctXml, chartId, drawingId)
    zip.file('[Content_Types].xml', updatedCt)
  }

  return zip.generateAsync({ type: 'arraybuffer' })
}

function buildChartXml({ title, chartType, catRef, valRef, seriesName, catTitle, valTitle }) {
  const c = 'c'
  const a = 'a'
  const r = 'r'

  const hasVal = !!valRef

  const seriesXml = hasVal ? `
    <${c}:ser>
      <${c}:idx val="0"/>
      <${c}:order val="0"/>
      <${c}:tx><${c}:strRef><${c}:f>${seriesName}</${c}:f></${c}:strRef></${c}:tx>
      <${c}:cat><${c}:strRef><${c}:f>${catRef}</${c}:f></${c}:strRef></${c}:cat>
      <${c}:val><${c}:numRef><${c}:f>${valRef}</${c}:f></${c}:numRef></${c}:val>
    </${c}:ser>` : ''

  const catAxisXml = hasVal ? `
    <${c}:catAx>
      <${c}:axId val="1"/>
      <${c}:scaling><${c}:orientation val="minMax"/></${c}:scaling>
      <${c}:delete val="0"/>
      <${c}:axPos val="b"/>
      <${c}:crossAx val="2"/>
      <${c}:title>
        <${c}:tx><${c}:rich><${a}:bodyPr/><${a}:lstStyle/><${a}:p><${a}:r><${a}:rPr/><${a}:t>${catTitle}</${a}:t></${a}:r></${a}:p></${c}:rich></${c}:tx>
        <${c}:overlay val="0"/>
      </${c}:title>
    </${c}:catAx>
    <${c}:valAx>
      <${c}:axId val="2"/>
      <${c}:scaling><${c}:orientation val="minMax"/></${c}:scaling>
      <${c}:delete val="0"/>
      <${c}:axPos val="l"/>
      <${c}:crossAx val="1"/>
      <${c}:title>
        <${c}:tx><${c}:rich><${a}:bodyPr/><${a}:lstStyle/><${a}:p><${a}:r><${a}:rPr/><${a}:t>${valTitle}</${a}:t></${a}:r></${a}:p></${c}:rich></${c}:tx>
        <${c}:overlay val="0"/>
      </${c}:title>
    </${c}:valAx>` : ''

  const groupType = chartType === 'pie' || chartType === 'doughnut' ? 'pie' : 'bar'
  const pieSeries = chartType === 'pie' || chartType === 'doughnut'
    ? `<${c}:ser><${c}:idx val="0"/><${c}:order val="0"/><${c}:cat><${c}:strRef><${c}:f>${catRef}</${c}:f></${c}:strRef></${c}:cat><${c}:val><${c}:numRef><${c}:f>${catRef}</${c}:f></${c}:numRef></${c}:val></${c}:ser>`
    : seriesXml

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<${c}:chartSpace xmlns:${c}="http://schemas.openxmlformats.org/drawingml/2006/chart"
                 xmlns:${a}="http://schemas.openxmlformats.org/drawingml/2006/main"
                 xmlns:${r}="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <${c}:chart>
    <${c}:title>
      <${c}:tx><${c}:rich><${a}:bodyPr/><${a}:lstStyle/><${a}:p><${a}:r><${a}:rPr/><${a}:t>${title}</${a}:t></${a}:r></${a}:p></${c}:rich></${c}:tx>
      <${c}:overlay val="0"/>
    </${c}:title>
    <${c}:autoTitleDeleted val="0"/>
    <${c}:plotArea>
      <${c}:layout/>
      <${c}:${groupType}Chart>
        <${c}:barDir val="col"/>
        <${c}:grouping val="clustered"/>
        ${!pieSeries ? seriesXml : ''}
        ${pieSeries ? pieSeries : ''}
        <${c}:axId val="1"/>
        <${c}:axId val="2"/>
      </${c}:${groupType}Chart>
      ${catAxisXml}
    </${c}:plotArea>
    <${c}:legend><${c}:legendPos val="bottom"/><${c}:overlay val="0"/></${c}:legend>
    <${c}:plotVisOnly val="1"/>
  </${c}:chart>
</${c}:chartSpace>`
}

function buildDrawingXml({ chartId, chartEntry }) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
          xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <xdr:twoCellAnchor>
    <xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>10</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>15</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr>
        <xdr:cNvPr id="${chartId}" name="Chart ${chartId}"/>
        <xdr:cNvGraphicFramePr/>
      </xdr:nvGraphicFramePr>
      <xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId${chartId}"/>
        </a:graphicData>
      </a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>
</xdr:wsDr>`
}

function buildDrawingRelsXml({ chartEntry }) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart.xml"/>
</Relationships>`.replace('chart.xml', chartEntry.replace('xl/charts/', ''))
}

function injectDrawingRef(wsXml, drawingId) {
  if (wsXml.includes('<drawing')) return wsXml
  const closeTag = '</worksheet>'
  return wsXml.replace(closeTag,
    `<drawing r:id="rId${drawingId + 100}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
    ${closeTag}`)
}

function injectDrawingRel(relsXml, drawingId) {
  if (relsXml.includes(`drawing${drawingId}.xml`)) return relsXml
  const closeTag = '</Relationships>'
  const relEntry = `  <Relationship Id="rId${drawingId + 100}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingId}.xml"/>\n`
  return relsXml.replace(closeTag, relEntry + closeTag)
}

function injectContentTypes(ctXml, chartId, drawingId) {
  let xml = ctXml

  const chartPart = `  <Override PartName="/xl/charts/chart${chartId}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`
  if (!xml.includes(`charts/chart${chartId}.xml`)) {
    xml = xml.replace('</Types>', chartPart + '\n</Types>')
  }

  const drawingPart = `  <Override PartName="/xl/drawings/drawing${drawingId}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`
  if (!xml.includes(`drawings/drawing${drawingId}.xml`)) {
    xml = xml.replace('</Types>', drawingPart + '\n</Types>')
  }

  const relsPart = `  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
  if (!xml.includes('Extension="rels"')) {
    xml = xml.replace('</Types>', relsPart + '\n</Types>')
  }

  return xml
}
