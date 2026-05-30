import Mailgun from 'mailgun.js'
import FormData from 'form-data'

export async function sendEmail(to: string | string[], subject: string, text: string) {
  const key = process.env.MAILGUN_API_KEY
  if (!key || key === 'replace_me') {
    console.log('[mail disabled] To:', Array.isArray(to) ? to.join(', ') : to)
    console.log('[mail disabled] Subject:', subject)
    return
  }

  const region = process.env.MAILGUN_REGION ?? 'us'
  const url = region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
  const mg = new Mailgun(FormData).client({ username: 'api', key, url })

  return mg.messages.create(process.env.MAILGUN_DOMAIN!, {
    from: `2653 Legacy Place <noreply@${process.env.MAILGUN_DOMAIN}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
  })
}
