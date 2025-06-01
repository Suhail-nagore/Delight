import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Modal from "./model";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fetchAllOrders, updateOrder } from "../store/order";
import { useDispatch, useSelector } from "react-redux";
import ModalEditForm from "./ModalEditForm";
import axios from "axios";
import { DateRangePicker } from "react-date-range";
import { enGB } from "date-fns/locale";

const AdminOrdersPage = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [showDateRange, setShowDateRange] = useState(false); // New s
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editOrderData, setEditOrderData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const { allOrders, loading: ordersLoading } = useSelector((state) => state.order);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filterApplied, setFilterApplied] = useState(false); // New state to track filter application
  const [selectAll, setSelectAll] = useState(false);

  // Handle select/deselect all functionality


  const resetDateFilter = () => {
    setSelectedDateRange({
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    });
    setFilterApplied(false); // Reset the filter application state
    setShowDateRange(false);
  };
  

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("https://www.delightdiagnostics.in/api/doctors");
        const data = await response.json();
        setDoctors(data.doctors || []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };

    dispatch(fetchAllOrders());
    fetchDoctors();
  }, [dispatch]);

  const handleToggleDateRange = () => {
    setShowDateRange((prevState) => !prevState); // Toggle DateRange visibility
  };

  useEffect(() => {
    console.log("Updated editOrderData", editOrderData); // This will log the updated data when it's changed
  }, [editOrderData]); // Track when editOrderData changes

  const handleEditSubmit = async (formData) => {
    try {
      const orderId = editOrderData._id; // Get the current order ID
      const updatedData = formData; // The updated data from the form

      // Dispatch the updateOrder thunk to update the order in the server
      const action = await dispatch(updateOrder({ orderId, updatedData }));

      // Log the response for debugging
      if (action.type === "order/updateOrder/fulfilled") {
        console.log("Order updated successfully", action.payload);

        // Update local state to reflect the updated order
        const updatedOrder = action.payload; // assuming the response contains the updated order
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );

        // Close the modal after the update
        setEditOrderData(null);
      }
    } catch (error) {
      // Handle any errors
      console.error("Error updating order", error);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleEditOrder = (order) => {
    setEditOrderData(order); // Open the modal with the selected order's data
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmation = window.confirm("Are you sure you want to delete this order?");
    if (confirmation) {
      try {
        const response = await fetch(`https://www.delightdiagnostics.in/api/orders/${orderId}`, {
          method: "DELETE",
        });
  
        if (response.ok) {
          alert("Order deleted successfully!");
          setOrders(orders.filter((order) => order._id !== orderId));
          // dispatch(fetchAllOrders());
          window.location.reload(); // Reload the page after deleting the order
        } else {
          alert("Failed to delete the order.");
        }
      } catch (error) {
        console.error("Error deleting the order:", error);
      }
    }
  };
  
  const handleDeleteSelected = async () => {
    const confirmation = window.confirm("Are you sure you want to delete the selected orders?");
    if (confirmation) {
      try {
        for (let orderId of selectedOrders) {
          const response = await fetch(`https://www.delightdiagnostics.in/api/orders/${orderId}`, {
            method: "DELETE",
          });
  
          if (response.ok) {
            setOrders(orders.filter((order) => order._id !== orderId));
          }
        }
        alert("Selected orders deleted successfully!");
        resetDateFilter();
        // dispatch(fetchAllOrders());
        window.location.reload(); // Reload the page after deleting the selected orders
      } catch (error) {
        console.error("Error deleting selected orders:", error);
      }
    }
  };
  

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prevSelectedOrders) => {
      if (prevSelectedOrders.includes(orderId)) {
        return prevSelectedOrders.filter((id) => id !== orderId);
      }
      return [...prevSelectedOrders, orderId];
    });
  };

  const handleApplyFilter = () => {
    setFilterApplied(true);
    setShowDateRange(!showDateRange);
  };

  const filteredOrders = allOrders
    .filter((order) => {
      const doctor = doctors.find((doctor) => doctor._id === order.referredBy);
      return (
        order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doctor && doctor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.serialNo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .filter((order) => {
      if (filterApplied) {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate >= selectedDateRange.startDate && orderDate <= selectedDateRange.endDate
        );
      }
      return true; // No date range filter applied, show all orders
    });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true); // Show the button after scrolling 300px
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup the event listener when component unmounts
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Smooth scrolling effect
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all filtered orders
      setSelectAll(false);
      filteredOrders.forEach((order) => handleSelectOrder(order._id, false));
    } else {
      // Select all filtered orders
      setSelectAll(true);
      filteredOrders.forEach((order) => handleSelectOrder(order._id, true));
    }
  };

  useEffect(() => {
    // Update the "Select All" checkbox if all or none of the filtered orders are selected
    const allSelected =
      filteredOrders.length > 0 &&
      filteredOrders.every((order) => selectedOrders.includes(order._id));
    setSelectAll(allSelected);
  }, [filteredOrders, selectedOrders]);


  return (
    <div className="flex flex-col p-2 sm:p-8 space-y-4 sm:space-y-8 mt-16 bg-gray-50 min-h-screen">
      <div className="w-full max-w-full bg-white shadow-lg rounded-lg p-3 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6">Alter Report</h1>

        {/* Search and Controls - Made Responsive */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search by name, doctor, or serial no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Range Controls - Made Responsive */}
        <div className="mb-4">
          <Button
            onClick={handleToggleDateRange}
            className="w-full sm:w-auto bg-blue-600 text-white mb-4 sm:mb-6"
          >
            {showDateRange ? "Hide Date Range Filter" : "Show Date Range Filter"}
          </Button>
        </div>

        {showDateRange && (
          <div className="mb-4 sm:mb-6">
            <div className="w-full overflow-x-auto">
              <DateRangePicker
                ranges={[selectedDateRange]}
                onChange={(item) => {
                  const startDate = item.selection.startDate;
                  const endDate = item.selection.endDate;
                  const normalizedStartDate = new Date(startDate).setHours(0, 0, 0, 0);
                  const normalizedEndDate = new Date(endDate).setHours(23, 59, 59, 999);
                  setSelectedDateRange({
                    startDate: new Date(normalizedStartDate),
                    endDate: new Date(normalizedEndDate),
                    key: "selection",
                  });
                }}
                locale={enGB}
                className="max-w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
              <Button
                onClick={handleApplyFilter}
                className="w-full sm:w-auto bg-green-600 text-white"
              >
                Apply Filter
              </Button>
              <Button
                onClick={resetDateFilter}
                className="w-full sm:w-auto bg-red-600 text-white"
              >
                Remove Filter
              </Button>
            </div>
          </div>
        )}

        {/* Delete Selected Orders Button */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 mb-4">
            <Button
              className="w-full sm:w-auto bg-red-600 text-white"
              onClick={handleDeleteSelected}
            >
              Delete Selected Orders ({selectedOrders.length})
            </Button>
          </div>
        )}

        {/* Responsive Table Container */}
        <div className="w-full overflow-x-auto shadow-md rounded-lg">
          <div className="min-w-max">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="border p-2 text-left whitespace-nowrap">
                    Select{' '}
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                  </th>
                  <th className="border p-2 text-left whitespace-nowrap">Serial No</th>
                  <th className="border p-2 text-left whitespace-nowrap">Doctor Ref</th>
                  <th className="border p-2 text-left whitespace-nowrap">Date</th>
                  <th className="border p-2 text-left whitespace-nowrap">Patient Name</th>
                  <th className="border p-2 text-left whitespace-nowrap">Category</th>
                  <th className="border p-2 text-left whitespace-nowrap">SubCategory</th>
                  <th className="border p-2 text-left whitespace-nowrap">Placed By</th>
                  <th className="border p-2 text-left whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const doctor = doctors.find((doctor) => doctor._id === order.referredBy);
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="border p-2 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => handleSelectOrder(order._id)}
                          />
                        </td>
                        <td className="border p-2 whitespace-nowrap">{order.serialNo}</td>
                        <td className="border p-2 whitespace-nowrap">{doctor ? doctor.name : "None"}</td>
                        <td className="border p-2 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="border p-2 whitespace-nowrap">{order.name}</td>
                        <td className="border p-2 whitespace-nowrap">{order.category}</td>
                        <td className="border p-2 whitespace-nowrap">{order.subcategory}</td>
                        <td className="border p-2 whitespace-nowrap">{order.placedBy || "N/A"}</td>
                        <td className="border p-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              className="w-full sm:w-auto"
                              onClick={() => handleViewDetails(order)}
                            >
                              View
                            </Button>
                            <Button 
                              className="w-full sm:w-auto"
                              onClick={() => handleEditOrder(order)}
                            >
                              Edit
                            </Button>
                            <Button
                              className="w-full sm:w-auto bg-red-600 text-white"
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
                    <td colSpan="8" className="text-center py-4 text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          selectedOrder={selectedOrder}
        />
      )}

      {editOrderData && (
        <ModalEditForm
          isOpen={true}
          onClose={() => setEditOrderData(null)}
          onSubmit={handleEditSubmit}
          initialData={editOrderData}
        />
      )}

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition transform hover:scale-105 z-50"
        style={{ display: showScrollButton ? 'block' : 'none' }}
      >
        ↑
      </button>
    </div>
  );
};

export default AdminOrdersPage;
