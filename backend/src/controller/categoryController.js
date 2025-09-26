const getUserDbConnection = require('../../getUserDbConnection');

// ✅ Create a new category
exports.createCategory = async (req, res) => {
  const { category_name, CGST, SGST } = req.body;
  const dbName = req.params.dbName; // ✅ fixed here

  try {
    const db = await getUserDbConnection(dbName);
    const [result] = await db.query(
      'INSERT INTO categories (category_name, CGST, SGST) VALUES (?, ?, ?)',
      [category_name, CGST, SGST]
    );
    res.status(201).json({ message: 'Category created', id: result.insertId });
  } catch (err) {
    console.error('Create Category Error:', err);
    res.status(500).json({ message: 'Failed to create category' });
  }
};

// ✅ Get all categories
exports.getAllCategories = async (req, res) => {
  const dbName = req.params.dbName; // ✅ fixed here

  try {
    const db = await getUserDbConnection(dbName);
    const [rows] = await db.query('SELECT * FROM categories');
    res.json(rows);
  } catch (err) {
    console.error('Get Categories Error:', err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// ✅ Update category by ID
exports.updateCategoryById = async (req, res) => {
  const { id } = req.params;
  const { category_name, CGST, SGST } = req.body;
  const dbName = req.params.dbName; // ✅ fixed here

  try {
    const db = await getUserDbConnection(dbName);
    const [result] = await db.query(
      'UPDATE categories SET category_name = ?, CGST = ?, SGST = ? WHERE id = ?',
      [category_name, CGST, SGST, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    console.error('Update Category Error:', err);
    res.status(500).json({ message: 'Failed to update category' });
  }
};

// ✅ Delete category by ID
exports.deleteCategoryById = async (req, res) => {
  const { id } = req.params;
  const dbName = req.params.dbName; // ✅ fixed here

  try {
    const db = await getUserDbConnection(dbName);
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete Category Error:', err);
    res.status(500).json({ message: 'Failed to delete category' });
  }
};
