import OrderDetailsClient from "./OrderDetailsClient";

export default function MarketingAgentOrderDetailsPage() {
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return <OrderDetailsClient mapsKey={mapsKey} />;
}
