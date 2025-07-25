import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Modals from "../Models";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "react-date-range";
import { enGB } from "date-fns/locale";
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAllUnbilled, 
  deleteUnbilled, 
  setSelectedOrder, 
  clearSelectedOrder 
} from '../../store/unbilled';
import { toast } from "react-toastify";
import { placeOrder } from '../../store/order';
import { useNavigate } from "react-router-dom";
import ModalEditForms from "../ModalEditForms";
import api from '@/common/axios';;

const Unbilled = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.unbilled);
  const navigate = useNavigate();
  
  const [showDateRange, setShowDateRange] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editOrderData, setEditOrderData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filterApplied, setFilterApplied] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch orders and doctors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const doctorsResponse = await api.get("/doctors");
        setDoctors(doctorsResponse.data.doctors || []);
        dispatch(fetchAllUnbilled());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  const handleEditSubmit = async (formData) => {
    console.log(formData);
    try {
      const orderId = editOrderData._id;

      // If the payment mode is changed from Unbilled to something else
      if (formData.paymentMode !== "Unbilled") {
        // First, delete from unbilled collection
        await dispatch(deleteUnbilled(orderId));

        // Prepare data for order collection
        // Remove the UB prefix and other fields we don't want to transfer
        const orderData = {
          ...formData,
          // Don't include the existing serialNo as it will be generated by the order system
          serialNo: undefined, // Let the order system generate its own serial number
          _id: undefined // Don't transfer the _id
        };

        // Place as new order
        const orderResponse = await dispatch(placeOrder(orderData));

        if (orderResponse.meta.requestStatus === "fulfilled") {
          setEditOrderData(null);
          toast.success("Order moved to regular orders successfully");
          navigate("/print-report"); // Navigate to print report for the new order
        } else {
          toast.error("Failed to move order to regular orders");
        }
      } else {
        // If still unbilled, just update the unbilled record
        await api.put(`/unbilled/${orderId}`, formData);
        setEditOrderData(null);
        dispatch(fetchAllUnbilled());
        toast.success("Unbilled order updated successfully");
      }
    } catch (error) {
      console.error("Error updating order", error);
      toast.error("Failed to update order");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmation = window.confirm("Are you sure you want to delete this unbilled order?");
    if (confirmation) {
      try {
        const result = await dispatch(deleteUnbilled(orderId));
        if (result.meta.requestStatus === "fulfilled") {
          toast.success("Order deleted successfully");
        } else {
          toast.error("Failed to delete the order");
          console.error("Delete failed:", result.payload || result.error.message);
        }

      } catch (error) {
        console.error("Error deleting order:", error);
        toast.error("Failed to delete the order");
      }
    }
  };

  const handleDeleteSelected = async () => {
    const confirmation = window.confirm("Are you sure you want to delete the selected orders?");
    if (confirmation) {
      try {
        await Promise.all(
          selectedOrders.map(orderId => dispatch(deleteUnbilled(orderId)))
        );
        setSelectedOrders([]);
        toast.success("Selected orders deleted successfully");
      } catch (error) {
        console.error("Error deleting selected orders:", error);
        toast.error("Failed to delete some orders");
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const doctor = doctors.find(doc => doc._id === order.referredBy);
    const matchesSearch = 
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor && doctor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.serialNo.toLowerCase().includes(searchQuery.toLowerCase());

    if (!filterApplied) return matchesSearch;

    const orderDate = new Date(order.createdAt);
    return (
      matchesSearch &&
      orderDate >= selectedDateRange.startDate &&
      orderDate <= selectedDateRange.endDate
    );
  });

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedOrders(selectAll ? [] : filteredOrders.map(order => order._id));
  };

  const resetDateFilter = () => {
    setSelectedDateRange({
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    });
    setFilterApplied(false);
    setShowDateRange(false);
  };

  return (
    <div className="flex flex-col p-8 space-y-8 mt-16 bg-gray-50 min-h-screen">
      <div className="w-full max-w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Unbilled Transactions</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by name, doctor, or serial no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Range Filter */}
        <div className="mb-4">
          <Button
            onClick={() => setShowDateRange(!showDateRange)}
            className="bg-blue-600 text-white mb-6"
          >
            {showDateRange ? "Hide Date Range Filter" : "Show Date Range Filter"}
          </Button>
        </div>

        {showDateRange && (
          <div className="mb-6">
            <DateRangePicker
              ranges={[selectedDateRange]}
              onChange={item => setSelectedDateRange(item.selection)}
              locale={enGB}
            />
            <div className="mt-4">
              <Button
                onClick={() => {
                  setFilterApplied(true);
                  setShowDateRange(false);
                }}
                className="bg-blue-600 text-white mr-4"
              >
                Apply Filter
              </Button>
              <Button
                onClick={resetDateFilter}
                className="bg-red-600 text-white"
              >
                Remove Filter
              </Button>
            </div>
          </div>
        )}

        {/* Delete Selected Button */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 mb-4">
            <Button
              className="bg-red-600 text-white"
              onClick={handleDeleteSelected}
            >
              Delete Selected Orders ({selectedOrders.length})
            </Button>
          </div>
        )}

        {/* Orders Table */}
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th className="border p-2 text-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </th>
              <th className="border p-2 text-left">Serial No</th>
              <th className="border p-2 text-left">Doctor Ref</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Patient Name</th>
              <th className="border p-2 text-left">Category</th>
              <th className="border p-2 text-left">SubCategory</th>
              <th className="border p-2 text-left">Amount</th>
              <th className="border p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">Loading...</td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map(order => {
                const doctor = doctors.find(doc => doc._id === order.referredBy);
                return (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </td>
                    <td className="border p-2">{order.serialNo}</td>
                   
                    <td className="border p-2">{doctor ? doctor.name : "None"}</td>
                    <td className="border p-2">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="border p-2">{order.name}</td>
                    <td className="border p-2">{order.category}</td>
                    <td className="border p-2">{order.subcategory}</td>
                    <td className="border p-2">{order.finalPayment}</td>
                    <td className="border p-2">
                      <div className="flex space-x-2">
                        <Button onClick={() => setSelectedOrder(order)}>View</Button>
                        <Button onClick={() => setEditOrderData(order)}>Edit</Button>
                        <Button 
                          className="bg-red-600 text-white"
                          onClick={() => handleDeleteOrder(order._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  No unbilled orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <Modals
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          selectedOrder={selectedOrder}
        />
      )}

      {editOrderData && (
        <ModalEditForms
          isOpen={true}
          onClose={() => setEditOrderData(null)}
          onSubmit={handleEditSubmit}
          initialData={editOrderData}
        />
      )}
    </div>
  );
};

export default Unbilled;
