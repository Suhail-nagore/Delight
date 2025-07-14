import React, { useState, useEffect } from 'react';
import api from '@/common/axios';

const CategoryForm = () => {
  const [formData, setFormData] = useState({
    name: '',
  });

  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        // Update existing category
        const response = await api.put(
          `/category/${editingCategory._id}`,
          formData
        );
        setMessage(response.data.message || 'Category updated successfully!');
      } else {
        // Add new category
        const response = await api.post('/addCategory', formData);
        setMessage(response.data.message || 'Category added successfully!');
      }

      // Reset form and reload categories
      setFormData({ name: '' });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('An error occurred while processing the request.');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }
    try {
      await api.delete(`/category/${id}`);
      setMessage('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setMessage('An error occurred while deleting the category.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 mt-8">
      <h1 className="text-3xl font-bold mb-8 text-blue-600">
        {editingCategory ? 'Edit Category' : 'Add Category'}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md"
      >
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {editingCategory ? 'Update Category' : 'Submit'}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-lg font-semibold text-green-600">{message}</p>
      )}

      <div className="mt-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Category List</h2>
        {categories.length > 0 ? (
          <ul className="space-y-4">
            {categories.map((category) => (
              <li
                key={category._id}
                className="flex justify-between items-center bg-white shadow-md p-4 rounded-lg"
              >
                <span>{category.name}</span>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleEdit(category)}
                    className="bg-yellow-500 text-white py-1 px-3 rounded-lg hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="bg-red-600 text-white py-1 px-3 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No categories found.</p>
        )}
      </div>
    </div>
  );
};

export default CategoryForm;
