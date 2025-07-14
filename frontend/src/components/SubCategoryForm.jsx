import React, { useState, useEffect } from 'react';
import api from '@/common/axios';

const SubCategoryForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    referralFee: '',
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await api.get('/subcategories');
      const subCategoriesData = response.data.Subcategories || [];
      setSubCategories(subCategoriesData);
      setFilteredSubCategories(subCategoriesData);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

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
      let response;
      if (editingSubCategory) {
        // Update existing subcategory
        response = await api.put(
          `/subcategory/${editingSubCategory._id}`,
          formData
        );
        setMessage(response.data.message || 'Subcategory updated successfully!');
      } else {
        // Add new subcategory
        response = await api.post('/addSubCategory', formData);
        setMessage(response.data.message || 'Subcategory added successfully!');
      }

      // Reset form and reload subcategories
      setFormData({
        name: '',
        category: '',
        price: '',
        referralFee: '',
      });
      setEditingSubCategory(null);
      fetchSubCategories();
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while processing the subcategory.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }
    try {
      await api.delete(`/subcategory/${id}`);
      setMessage('Subcategory deleted successfully!');
      fetchSubCategories();
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while deleting the subcategory.');
    }
  };

  const handleEdit = (subCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      category: subCategory.category,
      price: subCategory.price,
      referralFee: subCategory.referralFee,
    });
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = subCategories.filter(
      (subCat) =>
        subCat.name.toLowerCase().includes(query) ||
        (subCat.category && subCat.category.toLowerCase().includes(query))
    );
    setFilteredSubCategories(filtered);
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-extrabold text-center mb-8 text-blue-600">
        {editingSubCategory ? 'Edit SubCategory' : 'Add SubCategory'}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl"
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
            className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category:
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price:
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="referralFee" className="block text-sm font-medium text-gray-700">
            Referral Fee:
          </label>
          <input
            type="number"
            id="referralFee"
            name="referralFee"
            value={formData.referralFee}
            onChange={handleChange}
            required
            className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {editingSubCategory ? 'Update SubCategory' : 'Add SubCategory'}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-lg font-semibold text-green-600">{message}</p>
      )}


<div className="mt-8 w-full max-w-2xl">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by name or category"
          className="w-full p-3 mb-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* SubCategory List */}
      <div className="mt-8 w-full max-w-2xl overflow-x-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-700">SubCategory List</h2>
        {filteredSubCategories.length > 0 ? (
          <table className="min-w-full bg-white shadow-lg rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Price</th>
                <th className="px-6 py-3 text-left">Referral Fee</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubCategories.map((subCat) => (
                <tr key={subCat._id} className="border-t text-gray-700 hover:bg-gray-50">
                  <td className="px-6 py-4">{subCat.name}</td>
                  <td className="px-6 py-4">{subCat.category || 'N/A'}</td>
                  <td className="px-6 py-4">{subCat.price}</td>
                  <td className="px-6 py-4">{subCat.referralFee}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEdit(subCat)}
                      className="text-yellow-600 hover:underline mx-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(subCat._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No subcategories available.</p>
        )}
      </div>
    </div>
  );
};

export default SubCategoryForm;
