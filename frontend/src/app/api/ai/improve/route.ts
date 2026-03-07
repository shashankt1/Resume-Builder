import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse')
    const parsed = await pdfParse(buffer)
    return parsed.text
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mammoth = require('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

async function buildDocx(resumeText: string): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = require('docx')

  const lines = resumeText.split('\n')
  const children: any[] = []
  let nameSet = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 80 } }))
      continue
    }

    const isHeader =
      trimmed === trimmed.toUpperCase() &&
      trimmed.length > 2 &&
      !/^\d/.test(trimmed) &&
      !trimmed.includes('@')

    if (!nameSet) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, bold: true, size: 32, color: '1e3a8a' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        })
      )
      nameSet = true
    } else if (isHeader) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, bold: true, size: 22, color: '1e40af' })],
          spacing: { before: 240, after: 80 },
          border: { bottom: { color: 'bfdbfe', size: 6, style: BorderStyle.SINGLE } },
        })
      )
    } else if (/^[-•*]/.test(trimmed)) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed.replace(/^[-•*]\s*/, ''), size: 20 })],
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      )
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 20 })],
          spacing: { after: 60 },
        })
      )
    }
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children,
    }],
  })

  return Packer.toBuffer(doc)
}

function buildPdfHtml(resumeText: string): string {
  const lines = resumeText.split('\n')
  let html = ''
  let nameSet = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { html += '<div style="margin:5px 0"></div>'; continue }

    const isHeader =
      trimmed === trimmed.toUpperCase() &&
      trimmed.length > 2 &&
      !/^\d/.test(trimmed) &&
      !trimmed.includes('@')

    if (!nameSet) {
      html += `<h1 style="text-align:center;color:#1e3a8a;font-size:22px;margin:0 0 8px;font-family:Georgia,serif;font-weight:700">${trimmed}</h1>`
      nameSet = true
    } else if (isHeader) {
      html += `<h2 style="color:#1e40af;font-size:12px;font-weight:700;margin:18px 0 4px;padding-bottom:3px;border-bottom:2px solid #bfdbfe;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em">${trimmed}</h2>`
    } else if (/^[-•*]/.test(trimmed)) {
      html += `<div style="display:flex;gap:8px;margin:2px 0;font-size:11px;line-height:1.55;font-family:Arial,sans-serif;color:#374151"><span style="color:#3b82f6;flex-shrink:0;margin-top:1px">▸</span><span>${trimmed.replace(/^[-•*]\s*/, '')}</span></div>`
    } else {
      html += `<p style="margin:2px 0;font-size:11px;line-height:1.55;font-family:Arial,sans-serif;color:#374151">${trimmed}</p>`
    }
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>*{box-sizing:border-box}body{margin:0;padding:36px 44px;background:white;color:#1f2937}
@page{margin:0}@media print{body{padding:28px 36px}}</style>
</head><body>${html}</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string
    const improvementsRaw = formData.get('improvements') as string

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
    }

    const improvements: string[] = JSON.parse(improvementsRaw || '[]')
    const resumeText = await extractTextFromFile(file)

    // Check scans
    const supabase = await createAdminClient()
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('scans')
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (profile.scans < 2) {
      return NextResponse.json({ error: 'Need at least 2 scans to improve resume' }, { status: 402 })
    }

    // Call Gemini
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are an expert resume writer. Rewrite this resume to be more ATS-friendly and impactful.

ORIGINAL RESUME:
${resumeText}

IMPROVEMENTS TO APPLY:
${improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

STRICT FORMATTING RULES:
- First line must be the person's full name only
- Use ALL CAPS for every section header (EXPERIENCE, EDUCATION, SKILLS, PROJECTS, CERTIFICATIONS, SUMMARY, etc.)
- Use "- " to start every bullet point
- Keep all facts accurate (names, companies, dates, numbers)
- Use strong action verbs
- Add metrics where logically possible
- No markdown, no JSON, no code fences, no asterisks for bold

Return ONLY the plain text resume. Nothing else.`

    const geminiResult = await model.generateContent(prompt)
    const improvedText = geminiResult.response.text().replace(/```[\s\S]*?```/g, '').trim()

    // Build DOCX
    const docxBuffer = await buildDocx(improvedText)
    const docxBase64 = docxBuffer.toString('base64')

    // Build PDF HTML
    const pdfHtml = buildPdfHtml(improvedText)
    const pdfHtmlBase64 = Buffer.from(pdfHtml).toString('base64')

    // Deduct 2 scans
    await supabase
      .from('profiles')
      .update({ scans: profile.scans - 2 })
      .eq('id', userId)

    // Log usage
    await supabase.from('scan_logs').insert({
      user_id: userId,
      action_type: 'improve_resume',
      scans_used: 2,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ improvedText, docxBase64, pdfHtmlBase64 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Improvement failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
