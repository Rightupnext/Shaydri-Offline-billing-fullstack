import React, { useEffect, useState } from 'react'
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer'
import numberToWords from './numberToWords'

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    borderBottom: '1px solid black',
    paddingBottom: 4,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  leftColumn: {
    width: '60%',
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoContainer: {
    marginRight: 8
  },
  titleContainer: {
    flexDirection: 'column'
  },
  rightColumn: {
    width: '40%',
    textAlign: 'right',
    lineHeight: 0.7
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 5
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 2
  },
  table: {
    marginTop: 8,
    border: '0.5px solid black'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid black'
  },
  tableRow: {
    flexDirection: 'row'
  },
  cell: {
    padding: 4,
    borderRight: '1px solid black',
    textAlign: 'center'
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4
  },
  customerDetails: {
    width: '60%',
    lineHeight: 0.9
  },
  invoiceDetails: {
    width: '38%',
    textAlign: 'right',
    lineHeight: 0.7
  },
  footerBoxed: {
    flexDirection: 'row',
    marginTop: 10,
    border: '1px solid black'
  },
  amountWordsBox: {
    width: '55%',
    padding: 6,
    borderRight: '1px solid black'
  },
  summaryBox: {
    width: '45%',
    padding: 6
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  receiverBox: {
    width: '50%'
  },
  authorityBox: {
    width: '50%',
    alignItems: 'flex-end'
  },
  authorityText: {
    textAlign: 'right',
    marginTop: 40
  }
})

const columnWidths = [30, 290, 40, 50, 60, 40, 60]

const DownloadA4Invocie = ({ selectedInvoice, profile, logoBase64 }) => {
  const items = selectedInvoice?.items || []
  const itemsPerPage = 29
  const pages = []

  for (let i = 0; i < items.length || i === 0; i += itemsPerPage) {
    const currentItems = items.slice(i, i + itemsPerPage)
    const isLastPage = i + itemsPerPage >= items.length
    const rowsToRender = itemsPerPage
    const blankRowsCount = rowsToRender - currentItems.length

    pages.push(
      <Page key={i} size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftColumn}>
            {logoBase64 && (
              <View style={styles.logoContainer}>
                <Image src={logoBase64} style={styles.logo} />
              </View>
            )}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{profile?.company_name}</Text>
              <Text style={styles.subtitle}>{profile?.slogan}</Text>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <Text>GSTIN: {profile?.gstNumber}</Text>
            <Text>{profile?.address}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <View style={styles.customerDetails}>
            <Text>Name: {selectedInvoice?.customer?.name}</Text>
            <Text>Address: {selectedInvoice?.customer?.address}</Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text>Invoice #: {selectedInvoice?.invoice_no}</Text>
            <Text>Date: {selectedInvoice?.computedtotals?.date}</Text>
            <Text>Status: {selectedInvoice?.computedtotals?.status}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {['S.NO', 'Description', `QTY`, 'unit', 'Rate', 'GST', 'Amount'].map((col, idx) => (
              <Text key={idx} style={{ ...styles.cell, width: columnWidths[idx] }}>
                {col}
              </Text>
            ))}
          </View>

          {/* Filled rows */}
          {currentItems.map((item, index) => {
            const totalKgs =
              parseFloat(item.kilo || 0) + parseFloat(item.grams ? item.grams / 1000 : 0)
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={{ ...styles.cell, width: columnWidths[0] }}>{i + index + 1}</Text>
                <Text style={{ ...styles.cell, width: columnWidths[1] }}>{item.description}</Text>
                <Text style={{ ...styles.cell, width: columnWidths[2] }}>{item.qty || '-'}</Text>
                <Text style={{ ...styles.cell, width: columnWidths[3] }}>
                  {['kg', 'g', 'liter', 'ml', 'quintal', 'tonne'].includes(item.unit)
                    ? `${(Number(item.kilo || 0) + Number(item.grams || 0) / 1000)
                        .toFixed(3)
                        .replace(/\.?0+$/, '')} ${item.unit}`
                    : `1 ${item.unit}`}
                </Text>
                <Text style={{ ...styles.cell, width: columnWidths[4] }}>{item.rate}</Text>
                <Text style={{ ...styles.cell, width: columnWidths[5] }}>{item.gst}%</Text>
                <Text style={{ ...styles.cell, width: columnWidths[6] }}>{item.amount}</Text>
              </View>
            )
          })}

          {/* Empty rows */}
          {Array.from({ length: blankRowsCount }).map((_, idx) => (
            <View key={`empty-${idx}`} style={styles.tableRow}>
              {columnWidths.map((w, colIdx) => (
                <Text key={colIdx} style={{ ...styles.cell, width: w }}>
                  {''}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Summary and Signatures only on last page */}
        {isLastPage && (
          <>
            <View style={styles.footerBoxed}>
              <View style={styles.amountWordsBox}>
                <Text>
                  <Text style={{ fontWeight: 'bold' }}>Amount in Words :</Text>{' '}
                  {numberToWords(selectedInvoice?.computedtotals?.finalAmount)}
                </Text>
              </View>
              <View style={styles.summaryBox}>
                {[
                  ['Subtotal :', selectedInvoice?.computedtotals?.subtotal],
                  ['CGST :', selectedInvoice?.computedtotals?.cgst],
                  ['SGST :', selectedInvoice?.computedtotals?.sgst],
                  ['Boxing Charge :', selectedInvoice?.computedtotals?.boxCharge],
                  ['Delivery Charge :', selectedInvoice?.computedtotals?.deliveryCharge],
                  ['Discount :', selectedInvoice?.computedtotals?.discount],
                  ['Net Payable :', selectedInvoice?.computedtotals?.finalAmount]
                ].map(([label, value], idx) => (
                  <View key={idx} style={styles.summaryRow}>
                    <Text>{label}</Text>
                    <Text>{value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.signatureSection}>
              <View style={styles.receiverBox}>
                <Text>Receiver Sign</Text>
              </View>
              <View style={styles.authorityBox}>
                <Text>For {profile?.company_name}</Text>
                <Text style={styles.authorityText}>Authorized Signature</Text>
              </View>
            </View>
          </>
        )}

        {/* Footer Page Number */}
        <View
          fixed
          style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 9
          }}
        >
          <Text
            render={({ pageNumber, totalPages }) => `Total Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    )
  }

  return <Document>{pages}</Document>
}

export default DownloadA4Invocie
