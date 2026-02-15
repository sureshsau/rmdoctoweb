"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { orderService, OrderDetails } from "@/services/order.service";
import { 
    AlertCircle, 
    Calendar, 
    CreditCard, 
    Truck, 
    CheckCircle2, 
    X, 
    Package, 
    User,
    MapPin,
    Phone,
    Mail,
    Clock,
    ChevronLeft,
    Download,
    Printer,
    Share2,
    MoreVertical,
    Edit,
    Copy,
    Archive,
    Send,
    FileText,
    ShoppingBag,
    Home,
    TrendingUp,
    Award,
    Shield,
    Star,
    MessageCircle,
    Bell,
    Settings,
    LogOut,
    Menu,
    Search,
    Filter,
    RefreshCw,
    DollarSign,
    Percent,
    Receipt,
    QrCode
} from "lucide-react";
import Link from "next/link";

const getStatusColor = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: any }> = {
        completed: { bg: "bg-emerald-500", text: "text-emerald-700", icon: CheckCircle2 },
        delivered: { bg: "bg-emerald-500", text: "text-emerald-700", icon: CheckCircle2 },
        pending: { bg: "bg-amber-500", text: "text-amber-700", icon: Clock },
        processing: { bg: "bg-blue-500", text: "text-blue-700", icon: RefreshCw },
        cancelled: { bg: "bg-rose-500", text: "text-rose-700", icon: X },
        shipped: { bg: "bg-indigo-500", text: "text-indigo-700", icon: Truck },
        default: { bg: "bg-gray-500", text: "text-gray-700", icon: Package }
    };
    return statusMap[status.toLowerCase()] || statusMap.default;
};

const getPaymentStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
        paid: "bg-emerald-100 text-emerald-700",
        pending: "bg-amber-100 text-amber-700",
        failed: "bg-rose-100 text-rose-700",
        refunded: "bg-purple-100 text-purple-700",
        default: "bg-gray-100 text-gray-700"
    };
    return statusMap[status.toLowerCase()] || statusMap.default;
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatAmount = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

export default function ReceptionistOrderDetailsPage() {
    const router = useRouter();
    const { orderId } = useParams();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"details" | "timeline" | "items">("details");
    const [showActions, setShowActions] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await orderService.getOrderDetails(orderId as string);
                if (res.success) {
                    setOrder(res.data);
                } else {
                    setError("Order not found or permission denied.");
                }
            } catch (err) {
                setError("Failed to load order details.");
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId]);

    const handleCopyOrderId = () => {
        navigator.clipboard.writeText(order?.orderId || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <AlertCircle className="w-6 h-6" />
                            <h2 className="text-lg font-semibold">Error Loading Order</h2>
                        </div>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h2>
                        <p className="text-gray-500 mb-6">The order you're looking for doesn't exist or has been removed.</p>
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statusColors = getStatusColor(order.orderStatus);
    const StatusIcon = statusColors.icon;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header with Navigation */}
                <div className="mb-4 sm:mb-6">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Orders
                    </button>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                            Order #{order.orderId}
                                        </h1>
                                        <button
                                            onClick={handleCopyOrderId}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors relative"
                                            title="Copy Order ID"
                                        >
                                            <Copy className="w-4 h-4 text-gray-500" />
                                            {copied && (
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                                    Copied!
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Placed on {formatDate(order.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-lg">
                                    <StatusIcon className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">{order.orderStatus}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                                <p className="text-lg font-bold text-gray-900">{formatAmount(order.pricing.payableAmount)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Payment</p>
                                <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${getPaymentStatusColor(order.paymentStatus)}`}>
                                    {order.paymentStatus}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Payment Mode</p>
                                <p className="text-sm font-medium text-gray-900">{order.paymentMode}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Items</p>
                                <p className="text-sm font-medium text-gray-900">{order.items.length} item(s)</p>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
                            {[
                                { id: "details", label: "Order Details", icon: FileText },
                                { id: "items", label: "Items", icon: ShoppingBag },
                                { id: "timeline", label: "Timeline", icon: Clock }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? "bg-blue-500 text-white shadow-sm"
                                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="text-sm">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-4 sm:space-y-6">
                    {activeTab === "details" && (
                        <>
                            {/* Order Items Summary */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h2 className="font-semibold text-gray-900">Order Items</h2>
                                </div>
                                <div className="p-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            {item.medicine?.image ? (
                                                <img 
                                                    src={item.medicine.image} 
                                                    alt={item.medicine.name} 
                                                    className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{item.medicine.name}</h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Brand</p>
                                                        <p className="text-sm font-medium text-gray-700">{item.medicine.brandName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Dosage</p>
                                                        <p className="text-sm font-medium text-gray-700">{item.medicine.dosageForm}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Quantity</p>
                                                        <p className="text-sm font-medium text-gray-700">{item.quantity}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Price</p>
                                                        <p className="text-sm font-medium text-gray-700">{formatAmount(item.price)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        Delivery Address
                                    </h2>
                                </div>
                                <div className="p-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{order.deliveryAddress.fullName}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {order.deliveryAddress.addressLine1}
                                                {order.deliveryAddress.addressLine2 && <>, {order.deliveryAddress.addressLine2}</>}
                                                <br />
                                                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{order.deliveryAddress.phone}</span>
                                            </div>
                                        </div>
                                        {order.deliveryAddress.landmark && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Landmark</p>
                                                <p className="text-sm text-gray-700">{order.deliveryAddress.landmark}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-gray-500" />
                                        Payment Summary
                                    </h2>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium text-gray-900">{formatAmount(order.pricing.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">GST</span>
                                            <span className="font-medium text-gray-900">{formatAmount(order.pricing.gstTotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Delivery Charge</span>
                                            <span className="font-medium text-gray-900">{formatAmount(order.pricing.deliveryCharge)}</span>
                                        </div>
                                        {order.pricing.discount > 0 && (
                                            <div className="flex justify-between text-sm text-emerald-600">
                                                <span>Discount</span>
                                                <span>-{formatAmount(order.pricing.discount)}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-gray-200 my-2 pt-2">
                                            <div className="flex justify-between font-semibold">
                                                <span className="text-gray-900">Total</span>
                                                <span className="text-gray-900">{formatAmount(order.pricing.payableAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Agent & OTP */}
                            {order.deliveryAgent && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100">
                                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Truck className="w-4 h-4 text-gray-500" />
                                            Delivery Information
                                        </h2>
                                    </div>
                                    <div className="p-4">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Delivery Agent</p>
                                                <p className="font-medium text-gray-900">{order.deliveryAgent.name || "N/A"}</p>
                                                {order.deliveryAgent.phone && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm text-gray-600">{order.deliveryAgent.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === "items" && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-900">All Items</h2>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                            {item.medicine?.image ? (
                                                <img 
                                                    src={item.medicine.image} 
                                                    alt={item.medicine.name} 
                                                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{item.medicine.name}</h3>
                                                <p className="text-sm text-gray-600 mb-2">{item.medicine.brandName}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Dosage:</span>
                                                        <span className="ml-2 text-gray-900">{item.medicine.dosageForm}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Quantity:</span>
                                                        <span className="ml-2 text-gray-900">{item.quantity}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Unit Price:</span>
                                                        <span className="ml-2 text-gray-900">{formatAmount(item.price)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Total:</span>
                                                        <span className="ml-2 font-semibold text-gray-900">
                                                            {formatAmount(item.price * item.quantity)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "timeline" && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-900">Order Timeline</h2>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-200" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Order Placed</p>
                                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                                            <p className="text-xs text-gray-400 mt-1">Order has been successfully placed</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="relative">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered'
                                                    ? 'bg-emerald-100' : 'bg-gray-100'
                                            }`}>
                                                <RefreshCw className={`w-4 h-4 ${
                                                    order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered'
                                                        ? 'text-emerald-600' : 'text-gray-400'
                                                }`} />
                                            </div>
                                            {order.orderStatus === 'shipped' || order.orderStatus === 'delivered' ? (
                                                <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-200" />
                                            ) : null}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Processing</p>
                                            <p className="text-sm text-gray-500">
                                                {order.orderStatus === 'processing' ? 'In progress' : 'Pending'}
                                            </p>
                                        </div>
                                    </div>

                                    {order.orderStatus === 'shipped' && (
                                        <div className="flex gap-3">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <Truck className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-200" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Shipped</p>
                                                <p className="text-sm text-gray-500">Order has been shipped</p>
                                            </div>
                                        </div>
                                    )}

                                    {order.orderStatus === 'delivered' && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Delivered</p>
                                                <p className="text-sm text-gray-500">Order has been delivered</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons removed as per request */}
            </div>
        </div>
    );
}