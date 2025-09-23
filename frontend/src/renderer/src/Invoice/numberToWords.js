  function numberToWords(num) {
    const a = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen'
    ]
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    const numToWords = (n) => {
      if (n < 20) return a[n]
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')
      if (n < 1000)
        return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numToWords(n % 100) : '')
      if (n < 100000)
        return (
          numToWords(Math.floor(n / 1000)) +
          ' Thousand' +
          (n % 1000 ? ' ' + numToWords(n % 1000) : '')
        )
      if (n < 10000000)
        return (
          numToWords(Math.floor(n / 100000)) +
          ' Lakh' +
          (n % 100000 ? ' ' + numToWords(n % 100000) : '')
        )
      return (
        numToWords(Math.floor(n / 10000000)) +
        ' Crore' +
        (n % 10000000 ? ' ' + numToWords(n % 10000000) : '')
      )
    }

    if (isNaN(num)) return 'Invalid number'

    const [rupeesStr, paiseStr] = Number(num).toFixed(2).split('.')
    const rupees = parseInt(rupeesStr)
    const paise = parseInt(paiseStr)

    let words = ''
    if (rupees > 0) words += numToWords(rupees) + ' Rupees'
    if (paise > 0) words += (words ? ' and ' : '') + numToWords(paise) + ' Paise'
    if (!words) words = 'Zero Rupees'
    return words + ' Only'
  }

export default numberToWords
