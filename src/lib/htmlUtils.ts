export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function htmlToPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

export function wrapPlainText(text: string): string {
  if (!text) return ''
  if (text.startsWith('<')) return text
  return `<p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
}
