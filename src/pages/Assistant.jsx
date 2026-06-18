import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { Button, Card } from '../components/ui/index'
import { IconMic, IconZap } from '../assets/icons/index'

function IconSend({ size=18, color='currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}
function IconBot({ size=18, color='currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="15" x2="8" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/></svg>
}

const QUICK_PROMPTS = [
  { label: 'Band 7 tips', text: 'What are the top 3 things I need to do to reach Band 7 overall?' },
  { label: 'Speaking Fluency', text: 'How can I improve my Fluency score in IELTS Speaking? Give me specific techniques.' },
  { label: 'Task 2 structure', text: 'Explain the perfect paragraph structure for IELTS Writing Task 2.' },
  { label: 'Reading traps', text: 'What are the most common traps in IELTS Reading True/False/Not Given questions?' },
  { label: 'Listening distractors', text: 'How do IELTS examiners use distractors in the Listening test? Give examples.' },
  { label: 'Vocabulary boost', text: 'Give me 10 high-scoring academic phrases I can use in IELTS Writing Task 2.' },
]

const SYSTEM_PROMPT = `You are an expert IELTS tutor with 15+ years of experience. You help students prepare for the IELTS exam.

Your expertise:
- All 4 modules: Listening, Reading, Writing, Speaking
- Band descriptors and scoring criteria
- Common student mistakes and how to fix them
- Exam strategies and time management

Rules:
- Be specific and actionable — no vague advice
- Use IELTS terminology correctly (band scores, criteria names, task types)
- Give examples when explaining concepts
- Keep responses concise but complete
- Format with clear structure when listing tips or steps
- If asked about scores, reference the official IELTS band descriptors`

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hey! I'm your IELTS AI tutor. Ask me anything about the exam — strategies, grammar, vocabulary, how to improve your band score, or practice questions. What do you want to work on today?",
    }
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', text: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Build Gemini conversation history
    const history = messages.slice(1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }))

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error('NO_KEY')

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [
              ...history,
              { role: 'user', parts: [{ text: msg }] }
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
          })
        }
      )
      const data = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "Sorry, I couldn't generate a response. Please try again."
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      const errMsg = err.message === 'NO_KEY'
        ? "Add your Gemini API key to .env as VITE_GEMINI_API_KEY to enable AI responses."
        : "Connection error. Check your API key and internet connection."
      setMessages(prev => [...prev, { role: 'assistant', text: errMsg }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const formatText = (text) => {
    // Simple markdown-like formatting
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <div key={i} style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 8, marginBottom: 2 }}>{line.slice(2, -2)}</div>
        }
        if (line.match(/^\d+\./)) {
          return <div key={i} style={{ paddingLeft: 12, marginBottom: 3 }}>{line}</div>
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <div key={i} style={{ paddingLeft: 12, marginBottom: 3, display: 'flex', gap: 6 }}><span style={{ color: 'var(--accent)', flexShrink: 0 }}>—</span>{line.slice(2)}</div>
        }
        if (line.trim() === '') return <div key={i} style={{ height: 6 }}/>
        return <span key={i}>{line}<br/></span>
      })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '100vh' }}>

        {/* Header */}
        <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>AI Tutor</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-dim)', border: '1px solid rgba(124,92,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBot size={20} color="var(--accent)"/>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>
                IELTS <span style={{ color: 'var(--accent)' }}>Assistant</span>
              </h1>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Powered by Gemini · Expert IELTS tutor</div>
            </div>
          </div>
        </div>

        {/* Quick prompts */}
        <div style={{ padding: '14px 32px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0, background: 'var(--bg-secondary)' }}>
          {QUICK_PROMPTS.map(q => (
            <button key={q.label} onClick={() => send(q.text)} style={{
              padding: '5px 13px', borderRadius: 99, border: '1px solid var(--border-soft)',
              background: 'var(--bg-card)', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: m.role === 'user' ? 'var(--accent-dim)' : 'rgba(31,217,160,0.12)',
                border: `1px solid ${m.role === 'user' ? 'rgba(124,92,252,0.3)' : 'rgba(31,217,160,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {m.role === 'user'
                  ? <IconZap size={14} color="var(--accent)"/>
                  : <IconBot size={14} color="#1fd9a0"/>
                }
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '72%',
                padding: '12px 16px',
                borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: m.role === 'user' ? 'var(--accent-dim)' : 'var(--bg-card)',
                border: `1px solid ${m.role === 'user' ? 'rgba(124,92,252,0.2)' : 'var(--border)'}`,
                fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)',
              }}>
                {m.role === 'assistant' ? formatText(m.text) : m.text}
              </div>
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(31,217,160,0.12)', border: '1px solid rgba(31,217,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBot size={14} color="#1fd9a0"/>
              </div>
              <div style={{ padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `bounce 0.9s ${delay}s infinite` }}/>
                ))}
                <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{ padding: '16px 32px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask anything about IELTS... (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{
                flex: 1, padding: '12px 16px',
                background: 'var(--bg-card)', border: '1px solid var(--border-soft)',
                borderRadius: 14, color: 'var(--text-primary)', fontSize: 14,
                fontFamily: "'Inter',sans-serif", resize: 'none', outline: 'none',
                transition: 'border-color 0.2s', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-soft)'}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 44, height: 44, borderRadius: 12, border: 'none', flexShrink: 0,
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-hover)',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: input.trim() && !loading ? '0 0 16px rgba(124,92,252,0.3)' : 'none',
              }}
            >
              <IconSend size={16} color={input.trim() && !loading ? '#fff' : 'var(--text-muted)'}/>
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
            AI can make mistakes — always verify band descriptors with official IELTS materials
          </div>
        </div>
      </main>
    </div>
  )
}
