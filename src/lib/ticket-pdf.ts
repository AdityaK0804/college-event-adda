import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

interface TicketData {
  ticketId: string
  eventTitle: string
  eventDate: string
  eventTime: string
  venue: string
  college: string
  category: string
  studentName: string
  quantity: number
  qrData: string | null
}

/**
 * Generate a professional PDF ticket.
 * Uses jsPDF directly (no html2canvas) for crisp, vector-quality output.
 * Mobile-friendly — works entirely client-side.
 */
export async function generateTicketPDF(data: TicketData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 200] })

  const W = 100 // card width
  const purple = '#8B5CF6'
  const dark = '#1a1a1a'
  const gray = '#6b7280'
  const lightBg = '#f5f3ff'

  // ── Background card ──
  doc.setFillColor(lightBg)
  doc.roundedRect(4, 4, W - 8, 192, 4, 4, 'F')

  // ── Header stripe ──
  doc.setFillColor(purple)
  doc.roundedRect(4, 4, W - 8, 28, 4, 4, 'F')
  // Cover bottom corners of stripe
  doc.rect(4, 20, W - 8, 12, 'F')

  // Brand name
  doc.setTextColor('#ffffff')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('CRESCENT PASS', W / 2, 13, { align: 'center' })

  // Event title
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(data.eventTitle, W - 20)
  doc.text(titleLines, W / 2, 22, { align: 'center' })

  // ── Event details ──
  let y = 40
  doc.setTextColor(gray)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('DATE & TIME', 12, y)
  doc.setTextColor(dark)
  doc.setFontSize(9)
  doc.text(`${data.eventDate}  •  ${data.eventTime}`, 12, y + 5)

  y += 14
  doc.setTextColor(gray)
  doc.setFontSize(7)
  doc.text('VENUE', 12, y)
  doc.setTextColor(dark)
  doc.setFontSize(9)
  const venueLines = doc.splitTextToSize(`${data.venue}, ${data.college}`, W - 24)
  doc.text(venueLines, 12, y + 5)

  y += 8 + venueLines.length * 4
  doc.setTextColor(gray)
  doc.setFontSize(7)
  doc.text('ATTENDEE', 12, y)
  doc.setTextColor(dark)
  doc.setFontSize(9)
  doc.text(data.studentName, 12, y + 5)

  y += 12
  doc.setTextColor(gray)
  doc.setFontSize(7)
  doc.text('CATEGORY', 12, y)
  doc.text('QTY', W - 26, y)
  doc.setTextColor(dark)
  doc.setFontSize(9)
  doc.text(data.category, 12, y + 5)
  doc.text(String(data.quantity), W - 26, y + 5)

  // ── Dashed separator ──
  y += 14
  doc.setDrawColor('#d1d5db')
  doc.setLineDashPattern([2, 2], 0)
  doc.line(12, y, W - 12, y)
  doc.setLineDashPattern([], 0)

  // ── QR Code ──
  y += 6
  if (data.qrData) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data.qrData, {
        width: 300, margin: 1,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      })
      const qrSize = 40
      doc.addImage(qrDataUrl, 'PNG', (W - qrSize) / 2, y, qrSize, qrSize)
      y += qrSize + 4
    } catch {
      y += 4
    }
  }

  // ── Ticket ID ──
  doc.setTextColor(gray)
  doc.setFontSize(6.5)
  doc.text('TICKET ID', W / 2, y, { align: 'center' })
  doc.setTextColor(dark)
  doc.setFontSize(8)
  doc.setFont('courier', 'bold')
  doc.text(data.ticketId.slice(0, 16).toUpperCase(), W / 2, y + 4, { align: 'center' })

  // ── Footer ──
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(gray)
  doc.setFontSize(6)
  doc.text('Show this ticket at the entrance for check-in', W / 2, 190, { align: 'center' })

  // Save
  const filename = `ticket-${data.ticketId.slice(0, 8)}.pdf`
  doc.save(filename)
}
