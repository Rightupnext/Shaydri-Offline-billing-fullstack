const moment = require("moment");
const getUserDbConnection = require("../../getUserDbConnection");

// 🔸 Create Invoice
exports.createInvoice = async (req, res) => {
  const dbName = req.params.dbName;
  const { invoice_no, customer, items, charges, computedtotals } = req.body;

  const connection = await getUserDbConnection(dbName);
  const transaction = await connection.getConnection();

  try {
    // 🔒 Start transaction
    await transaction.beginTransaction();

    // 1️⃣ Insert the full invoice JSON
    const [result] = await transaction.query(
      `INSERT INTO invoices 
        (invoice_no, customer, items, charges, computedtotals)
       VALUES (?, ?, ?, ?, ?)`,
      [
        invoice_no,
        JSON.stringify(customer || {}),
        JSON.stringify(items || []),
        JSON.stringify(charges || {}),
        JSON.stringify(computedtotals || {}),
      ]
    );

    const invoiceId = result.insertId;

    // 2️⃣ Loop through each item and reduce inventory (TRIGGER handles the actual reduction)
    for (const item of items) {
      const { inventory_item_id, qty, unit } = item;

      if (!inventory_item_id || !qty) continue;

      // Check stock first
      const [stockCheck] = await transaction.query(
        `SELECT stock_quantity FROM inventory WHERE id = ?`,
        [inventory_item_id]
      );

      if (!stockCheck.length) {
        console.warn(`⚠️ Inventory not found for ID: ${inventory_item_id}`);
        throw new Error(`Inventory not found for ID: ${inventory_item_id}`);
      }

      const available = Number(stockCheck[0].stock_quantity);

      if (available < qty) {
        throw new Error(
          `Not enough stock for item ${inventory_item_id}. Available: ${available}, Requested: ${qty}`
        );
      }

      // 3️⃣ Insert into stock_transactions → Trigger updates inventory automatically
      await transaction.query(
        `INSERT INTO stock_transactions (inventory_id, transaction_type, quantity, unit)
         VALUES (?, 'reduce', ?, ?)`,
        [inventory_item_id, qty, unit]
      );
    }

    // ✅ Commit all queries if successful
    await transaction.commit();

    res.status(201).json({
      message: "Invoice created successfully",
      id: invoiceId,
    });
  } catch (err) {
    console.error("❌ Create Invoice Error:", err);

    // ❌ Rollback everything if any step fails
    await transaction.rollback();

    res.status(500).json({
      message: "Failed to create invoice",
      error: err.message,
    });
  } finally {
    transaction.release();
  }
};

// 🔸 Get All Invoices
exports.getAllInvoices = async (req, res) => {
  const dbName = req.params.dbName;
  //  console.log("Requested DB:", dbName);
  try {
    const db = await getUserDbConnection(dbName);
    const [rows] = await db.query(
      `SELECT * FROM invoices ORDER BY created_at DESC`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Get Invoices Error:", err);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
};

// 🔸 Get Invoice by ID
exports.getInvoiceById = async (req, res) => {
  const dbName = req.params.dbName;
  const { id } = req.params;

  try {
    const db = await getUserDbConnection(dbName);
    const [rows] = await db.query(`SELECT * FROM invoices WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("❌ Get Invoice By ID Error:", err);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
};

// 🔸 Update Invoice by ID
exports.updateInvoiceById = async (req, res) => {
  const dbName = req.params.dbName;
  const { id } = req.params;

  const { invoice_no, customer, items, charges, computedtotals } = req.body;

  try {
    if (!invoice_no || !items || !computedtotals) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = await getUserDbConnection(dbName);

    // ✅ Fetch existing invoice
    const [existingRows] = await db.query(
      `SELECT * FROM invoices WHERE id = ?`,
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const existingInvoice = existingRows[0];

    let oldComputed =
      typeof existingInvoice.computedtotals === "string"
        ? JSON.parse(existingInvoice.computedtotals)
        : existingInvoice.computedtotals;

    // ✅ Preserve paidAmount & paymentHistory
    computedtotals.paidAmount = Number(oldComputed.paidAmount || 0);
    computedtotals.paymentHistory = Array.isArray(oldComputed.paymentHistory)
      ? oldComputed.paymentHistory
      : [];

    // ✅ Recalculate finalAmount & balance
    const finalAmount = Number(computedtotals.finalAmount || 0);
    const paidAmount = computedtotals.paidAmount;
    const balance = Math.max(finalAmount - paidAmount, 0);
    computedtotals.balanceAmount = balance;

    // ✅ Update status based on balance
    if (paidAmount === 0) {
      computedtotals.status = "UnPaid";
    } else if (balance === 0) {
      computedtotals.status = "Credit-Bill";
    } else {
      computedtotals.status = "Partially";
    }

    // ✅ Update invoice
    await db.query(
      `UPDATE invoices 
       SET 
         invoice_no = ?, 
         customer = ?, 
         items = ?, 
         charges = ?, 
         computedtotals = ?
       WHERE id = ?`,
      [
        invoice_no,
        JSON.stringify(customer),
        JSON.stringify(items),
        JSON.stringify(charges || {}),
        JSON.stringify(computedtotals),
        id,
      ]
    );

    res.status(200).json({
      message: "Invoice updated successfully",
      status: computedtotals.status,
      finalAmount,
      paidAmount,
      balanceAmount: balance,
      paymentHistory: computedtotals.paymentHistory,
    });
  } catch (err) {
    console.error("❌ Update Invoice Error:", err);
    res.status(500).json({ message: "Failed to update invoice" });
  }
};

// 🔸 Delete Invoice by ID
exports.deleteInvoiceById = async (req, res) => {
  const dbName = req.params.dbName;
  const { id } = req.params;

  try {
    const db = await getUserDbConnection(dbName);
    await db.query(`DELETE FROM invoices WHERE id = ?`, [id]);

    res.status(200).json({ message: "Invoice deleted" });
  } catch (err) {
    console.error("❌ Delete Invoice Error:", err);
    res.status(500).json({ message: "Failed to delete invoice" });
  }
};
exports.getNextInvoiceNumber = async (req, res) => {
  const dbName = req.params.dbName;
  // console.log("📥 Requested DB:", dbName);

  try {
    const db = await getUserDbConnection(dbName);

    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    const [rows] = await db.query(
      `SELECT invoice_no FROM invoices WHERE invoice_no LIKE ?`,
      [`${prefix}%`]
    );

    // console.log("🔍 Matching invoices:", rows);

    let maxNumber = 0;

    for (const row of rows) {
      const invoice = row.invoice_no;
      // console.log("🧾 Found invoice:", invoice);

      if (invoice && invoice.toLowerCase().startsWith(prefix.toLowerCase())) {
        const numberPart = invoice.slice(prefix.length);
        const number = parseInt(numberPart, 10);
        // console.log("🔢 Parsed number part:", number);

        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    const paddedNumber = String(nextNumber).padStart(3, "0");
    const nextInvoiceNo = `${prefix}${paddedNumber}`;

    // console.log("✅ Next Invoice No:", nextInvoiceNo);
    res.status(200).json({ nextInvoiceNo });
  } catch (error) {
    console.error("❌ Error generating next invoice number:", error);
    res.status(500).json({ message: "Failed to generate invoice number" });
  }
};

exports.addPaymentToInvoice = async (req, res) => {
  const dbName = req.params.dbName;
  const { id } = req.params;
  const { payAmount } = req.body;

  if (!payAmount) {
    return res.status(400).json({ message: "Missing payAmount" });
  }

  try {
    const db = await getUserDbConnection(dbName);

    // Get the invoice
    const [rows] = await db.query(`SELECT * FROM invoices WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = rows[0];

    // Parse computedtotals safely
    let computed;
    try {
      computed =
        typeof invoice.computedtotals === "string"
          ? JSON.parse(invoice.computedtotals)
          : invoice.computedtotals;
    } catch (e) {
      return res
        .status(400)
        .json({ message: "Invalid computedtotals JSON format" });
    }

    // Initialize fields if missing
    computed.paidAmount = Number(computed.paidAmount || 0);
    computed.paymentHistory = Array.isArray(computed.paymentHistory)
      ? computed.paymentHistory
      : [];

    const finalAmount = Number(computed.finalAmount || 0);
    const paidNow = Number(payAmount);
    const balance = Math.max(finalAmount - computed.paidAmount, 0);

    // ❌ Strict check: prevent overpayment
    if (paidNow > balance) {
      return res.status(400).json({
        message: `Payment exceeds remaining balance. Remaining balance: ₹${balance}, attempted payment: ₹${paidNow}`,
      });
    }

    // ✅ Add new payment
    const today = new Date().toISOString().split("T")[0];
    computed.paidAmount += paidNow;
    computed.paymentHistory.push({ amount: paidNow, date: today });

    // 🧮 Recalculate balance and status
    const newBalance = Math.max(finalAmount - computed.paidAmount, 0);
    computed.balanceAmount = newBalance;
    computed.status = newBalance === 0 ? "Credit-Bill" : "Partially";

    // 💾 Save changes
    await db.query(`UPDATE invoices SET computedtotals = ? WHERE id = ?`, [
      JSON.stringify(computed),
      id,
    ]);

    // 📤 Return updated status
    res.status(200).json({
      message: "Payment updated successfully",
      status: computed.status,
      paidAmount: computed.paidAmount,
      balanceAmount: computed.balanceAmount,
      paymentHistory: computed.paymentHistory,
    });
  } catch (err) {
    console.error("❌ Payment Update Error:", err);
    res.status(500).json({ message: "Failed to process payment" });
  }
};

exports.getInvoiceAnalytics = async (req, res) => {
  const dbName = req.params.dbName;
  const { startDate, endDate } = req.query;
  const moment = require("moment");

  try {
    const db = await getUserDbConnection(dbName);

    const start =
      !startDate || startDate === "undefined"
        ? moment().startOf("month").format("YYYY-MM-DD")
        : startDate;

    const end =
      !endDate || endDate === "undefined"
        ? moment().endOf("month").format("YYYY-MM-DD")
        : endDate;

    // 🔁 Previous month range
    const prevStart = moment(start)
      .subtract(1, "month")
      .startOf("month")
      .format("YYYY-MM-DD");
    const prevEnd = moment(start)
      .subtract(1, "month")
      .endOf("month")
      .format("YYYY-MM-DD");

    // === Helper to compute stats from invoices
    const computeStatsFromInvoices = (invoices) => {
      let totalFinalAmount = 0;
      let totalBalanceAmount = 0;
      let statusCounts = { UnPaid: 0, Partially: 0, CreditBill: 0 };
      let statusAmounts = { UnPaid: 0, Partially: 0, CreditBill: 0 };

      for (const invoice of invoices) {
        let totals;
        try {
          totals =
            typeof invoice.computedtotals === "string"
              ? JSON.parse(invoice.computedtotals)
              : invoice.computedtotals;
        } catch {
          continue;
        }

        const status = (totals?.status || "").toLowerCase();
        const finalAmount = Number(totals?.finalAmount || 0);
        const paidAmount = Number(totals?.paidAmount || 0);
        const balanceAmount = Math.max(finalAmount - paidAmount, 0);

        totalFinalAmount += finalAmount;
        totalBalanceAmount += balanceAmount;

        if (status === "partially") {
          statusCounts.Partially++;
          statusAmounts.Partially += finalAmount;
        } else if (status === "credit-bill") {
          statusCounts.CreditBill++;
          statusAmounts.CreditBill += finalAmount;
        } else {
          statusCounts.UnPaid++;
          statusAmounts.UnPaid += finalAmount;
        }
      }

      return {
        totalFinalAmount,
        totalBalanceAmount,
        statusCounts,
        statusAmounts,
      };
    };

    // === Fetch invoices
    const [currentInvoices] = await db.query(
      `SELECT computedtotals, items, created_at FROM invoices WHERE DATE(created_at) BETWEEN ? AND ?`,
      [start, end]
    );

    const [previousInvoices] = await db.query(
      `SELECT computedtotals FROM invoices WHERE DATE(created_at) BETWEEN ? AND ?`,
      [prevStart, prevEnd]
    );

    const currentStats = computeStatsFromInvoices(currentInvoices);
    const previousStats = computeStatsFromInvoices(previousInvoices);

    // === Customer count
    const [customerResult] = await db.query(
      `SELECT COUNT(*) as count FROM customers`
    );
    const customerCount = customerResult[0]?.count || 0;

    // === Breakdown & payments
    const invoicesBreakdown = [];
    const mergedPaymentHistory = [];

    for (const invoice of currentInvoices) {
      let totals, items;
      try {
        totals =
          typeof invoice.computedtotals === "string"
            ? JSON.parse(invoice.computedtotals)
            : invoice.computedtotals;
        items =
          typeof invoice.items === "string"
            ? JSON.parse(invoice.items)
            : invoice.items;
      } catch {
        continue;
      }

      const finalAmount = Number(totals?.finalAmount || 0);
      const paidAmount = Number(totals?.paidAmount || 0);
      const balanceAmount = Math.max(finalAmount - paidAmount, 0);

      invoicesBreakdown.push({
        invoiceNo: totals?.invoiceNo || "Unknown",
        finalAmount,
        balanceAmount,
      });

      const payments = Array.isArray(totals?.paymentHistory)
        ? totals.paymentHistory
        : [];
      payments.forEach((payment) => {
        const paymentDate = moment(payment.date).format("YYYY-MM-DD");
        if (paymentDate >= start && paymentDate <= end) {
          mergedPaymentHistory.push({
            date: paymentDate,
            amount: Number(payment.amount) || 0,
          });
        }
      });
    }

    // === Daily payments summary
    const dailyTotalsMap = {};
    mergedPaymentHistory.forEach(({ date, amount }) => {
      dailyTotalsMap[date] = (dailyTotalsMap[date] || 0) + amount;
    });

    const dailyPayments = Object.entries(dailyTotalsMap).map(
      ([date, amount]) => ({
        date,
        amount,
      })
    );

    // === Sales Report (MRP vs Sales per Month)
    const monthlySales = {};

    for (const invoice of currentInvoices) {
      let items;
      try {
        items =
          typeof invoice.items === "string"
            ? JSON.parse(invoice.items)
            : invoice.items;
      } catch {
        continue;
      }

      const year = moment(invoice.created_at).format("YYYY");
      const month = moment(invoice.created_at).format("MMM");
      const yearMonthKey = `${year}-${month}`; // unique key per year+month

      if (!monthlySales[yearMonthKey]) {
        monthlySales[yearMonthKey] = {
          year: Number(year),
          month,
          mrp: 0,
          rate: 0,
        };
      }

      // Each invoice may contain multiple items
      if (Array.isArray(items)) {
        items.forEach((it) => {
          monthlySales[yearMonthKey].mrp +=
            (Number(it.mrp) || 0) * (Number(it.qty) || 0);
          monthlySales[yearMonthKey].rate +=
            (Number(it.rate) || 0) * (Number(it.qty) || 0);
        });
      }
    }

    const salesReport = Object.values(monthlySales).map((data) => ({
      year: data.year,
      month: data.month,
      Buymrp: data.mrp,
      SellingRate: data.rate,
      profit: data.rate - data.mrp,
      profitPercent: data.mrp
        ? (((data.rate - data.mrp) / data.mrp) * 100).toFixed(1)
        : 0,
    }));

    // === Totals and adjustments
    const totalPendingAmount =
      currentStats.statusAmounts.UnPaid + currentStats.statusAmounts.Partially;
    const finallyPaidAmount =
      currentStats.totalBalanceAmount - totalPendingAmount;
    const adjustedCreditBillAmount =
      currentStats.statusAmounts.CreditBill - finallyPaidAmount;

    // === Final response
    res.status(200).json({
      totalInvoices: currentInvoices.length,
      customerCount,
      totalFinalAmount: currentStats.totalFinalAmount,
      totalBalanceAmount: currentStats.totalBalanceAmount,
      totalCreditBillAmount: adjustedCreditBillAmount,
      totalPendingAmount,
      invoicesBreakdown,
      mergedPaymentHistory,
      dailyPayments,
      salesReport, // ✅ Added Sales Report
      statusCounts: currentStats.statusCounts,
      statusAmounts: currentStats.statusAmounts,

      previousFinalAmount: previousStats.totalFinalAmount,
      previousBalanceAmount: previousStats.totalBalanceAmount,
      previousCreditBillAmount: previousStats.statusAmounts.CreditBill,
      previousStatusCounts: previousStats.statusCounts,
      previousTotalInvoices: previousInvoices.length,
      previousCustomerCount: customerCount,
    });
  } catch (error) {
    console.error("❌ Invoice Analytics Error:", error);
    res.status(500).json({ message: "Failed to fetch invoice analytics" });
  }
};
