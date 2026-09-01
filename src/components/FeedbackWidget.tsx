import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface FeedbackWidgetProps {
  userId: string | null
}

export default function FeedbackWidget({ userId }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      setErrorMsg('Please write something before submitting.')
      return
    }

    console.log('Attempting to submit feedback...')
    console.log('User ID:', userId)
    console.log('Message length:', trimmed.length)

    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Current session:', session)
    console.log('Session error:', sessionError)

    if (!session) {
      setErrorMsg('You must be logged in to submit feedback.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setErrorMsg('')

    try {
      const { data, error } = await supabase.from('feedback').insert({
        user_id: userId,
        message: trimmed,
      })

      if (error) {
        console.error('Supabase feedback insert error:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log('Feedback submitted successfully:', data)
      setStatus('success')
      setMessage('')
      
      // Close after a short delay
      setTimeout(() => {
        setOpen(false)
        setStatus('idle')
      }, 1500)
    } catch (err) {
      setStatus('error')
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback'
      setErrorMsg(errorMessage)
      console.error('Feedback submission failed:', err)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setMessage('')
    setStatus('idle')
    setErrorMsg('')
  }

  return (
    <>
      {/* Floating button */}
      <button
        className="feedback-btn"
        onClick={() => setOpen(true)}
        aria-label="Give Feedback"
      >
        Give Feedback
      </button>

      {/* Popup modal */}
      {open && (
        <div className="feedback-modal">
          <div className="feedback-modal__inner">
            {status === 'success' ? (
              <div className="feedback-success">
                <span className="feedback-success__icon">✓</span>
                <p>Thanks for your feedback!</p>
              </div>
            ) : (
              <>
                <div className="feedback-modal__header">
                  <h3>Write your suggestion</h3>
                  <button
                    className="feedback-modal__close"
                    onClick={handleClose}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>

                <textarea
                  className="feedback-modal__textarea"
                  placeholder="Tell us what you think..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={status === 'submitting'}
                  rows={4}
                />

                {errorMsg && (
                  <p className="feedback-modal__error">{errorMsg}</p>
                )}

                <button
                  className="feedback-modal__submit"
                  onClick={handleSubmit}
                  disabled={status === 'submitting' || !message.trim()}
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Feedback'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
