import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') {
    const pdfParse = require('pdf-parse')
    return (await pdfParse(buffer)).text
  }
  const mammoth = require('mammoth')
  return (await mammoth.extractRawText({ buffer })).value
}

function buildDocx(text: string): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = require('docx')
  const lines = text.split('\n')
  const children: any[] = []
  let nameSet = false
  for (const line of lines) {
    const t = line.trim()
    if (!t) { children.push(new Paragraph({ spacing: { after: 80 } })); continue }
    const isHeader = t === t.toUpperCase() && t.length > 2 && !/^\d/.test(t) && !t.includes('@')
    if (!nameSet) {
      children.push(new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 32, color: '1e3a8a' })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }))
      nameSet = true
    } else if (isHeader) {
      children.push(new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 22, color: '1e40af' })], spacing: { before: 240, after: 80 }, border: { bottom: { color: 'bfdbfe', size: 6, style: BorderStyle.SINGLE } } }))
    } else if (/^[-•*]/.test(t)) {
      children.push(new Paragraph({ children: [new TextRun({ text: t.replace(/^[-•*]\s*/, ''), size: 20 })], bullet: { level: 0 }, spacing: { after: 60 } }))
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: t, size: 20 })], spacing: { after: 60 } }))
    }
  }
  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } }, children }] })
  return Packer.toBuffer(doc)
}

function buildPdfHtml(text: string): string {
  const lines = text.split('\n')
  let html = ''; let nameSet = false
  for (const line of lines) {
    const t = line.trim()
    if (!t) { html += '<div style="margin:5px 0"></div>'; continue }
    const isHeader = t === t.toUpperCase() && t.length > 2 && !/^\d/.test(t) && !t.includes('@')
    if (!nameSet) {
      html += `<h1 style="text-align:center;color:#1e3a8a;font-size:22px;margin:0 0 8px;font-family:Georgia,serif;font-weight:700">${t}</h1>`
      nameSet = true
    } else if (isHeader) {
      html += `<h2 style="color:#1e40af;font-size:12px;font-weight:700;margin:18px 0 4px;padding-bottom:3px;border-bottom:2px solid #bfdbfe;font-family:Arial,sans-serif;text-transform:uppercase">${t}</h2>`
    } else if (/^[-•*]/.test(t)) {
      html += `<div style="display:flex;gap:8px;margin:2px 0;font-size:11px;line-height:1.55;font-family:Arial,sans-serif"><span style="color:#3b82f6;flex-shrink:0">▸</span><span>${t.replace(/^[-•*]\s*/, '')}</span></div>`
    } else {
      html += `<p style="margin:2px 0;font-size:11px;line-height:1.55;font-family:Arial,sans-serif;color:#374151">${t}</p>`
    }
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box}body{margin:0;padding:36px 44px;background:white}@page{margin:0}@media print{body{padding:28px 36px}}</style></head><body>${html}</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string
    const jobDescription = formData.get('jobDescription') as string

    if (!file || !userId || !jobDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: profile } = await supabase.from('profiles').select('scans').eq('id', userId).single()
    if (!profile || profile.scans < 3) {
      return NextResponse.json({ error: 'Need 3 scans' }, { status: 402 })
    }

    const resumeText = await extractText(file)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are an expert ATS resume writer. Rewrite the resume below to perfectly match the job description provided.

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

RULES:
- Mirror keywords and phrases from the job description naturally
- Keep all factual info accurate (names, companies, dates)
- Use ALL CAPS for section headers (EXPERIENCE, EDUCATION, SKILLS, etc.)
- Use "- " for every bullet point
- Add metrics where logical
- No markdown, no JSON, no code fences

After the resume, on a new line write exactly:
MATCH_SCORE: [number between 75-98]
IMPROVEMENTS:
- [improvement 1]
- [improvement 2]
- [improvement 3]
- [improvement 4]
- [improvement 5]`

    const geminiResult = await model.generateContent(prompt)
    const raw = geminiResult.response.text().replace(/```[\s\S]*?```/g, '').trim()

    // Parse out score and improvements
    const scoreMatch = raw.match(/MATCH_SCORE:\s*(\d+)/)
    const matchScore = scoreMatch ? parseInt(scoreMatch[1]) : 85
    const impSection = raw.match(/IMPROVEMENTS:\n([\s\S]+)$/)
    const improvements = impSection
      ? impSection[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
      : []
    const tailoredText = raw.replace(/MATCH_SCORE:[\s\S]*$/, '').trim()

    const docxBuffer = await buildDocx(tailoredText)
    const docxBase64 = docxBuffer.toString('base64')
    const pdfHtmlBase64 = Buffer.from(buildPdfHtml(tailoredText)).toString('base64')

    await supabase.from('profiles').update({ scans: profile.scans - 3 }).eq('id', userId)
    await supabase.from('scan_logs').insert({ user_id: userId, action_type: 'tailor_to_job', scans_used: 3, created_at: new Date().toISOString() })

    return NextResponse.json({ tailoredText, docxBase64, pdfHtmlBase64, matchScore, improvements })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}
