/* eslint-disable max-lines */
"use client";

// Core
import { faBicycle, faStore, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ApolloCache,
  ApolloError,
  useMutation,
  useQuery,
} from "@apollo/client";
import { Message } from "primereact/message";
import { useRouter } from "next/navigation";

import {
  GoogleMap,
  DirectionsService,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";

// Components
import { PaddingContainer } from "@/lib/ui/useable-components/containers";
import Divider from "@/lib/ui/useable-components/custom-divider";
import UserAddressComponent from "@/lib/ui/useable-components/address";

// Context
import { GoogleMapsContext } from "@/lib/context/global/google-maps.context";
import { CartItem } from "@/lib/context/User/User.context";
import { useConfig } from "@/lib/context/configuration/configuration.context";

// Hooks
import useUser from "@/lib/hooks/useUser";
import useToast from "@/lib/hooks/useToast";
import useRestaurant from "@/lib/hooks/useRestaurant";
import { useUserAddress } from "@/lib/context/address/address.context";
import { useAuth } from "@/lib/context/auth/auth.context";

// Assets
import { InfoSvg } from "@/lib/utils/assets/svg";

// Constants
import { DAYS } from "@/lib/utils/constants/orders";
// Constant import removed for maintenance lab

// API
import { PLACE_ORDER, VERIFY_COUPON, ORDERS } from "@/lib/api/graphql";

// Interfaces
import {
  ICoupon,
  ICouponData,
  IOpeningTime,
  IOrder,
} from "@/lib/utils/interfaces";

// Types
import { OrderTypes } from "@/lib/utils/types/order";

// Methods
import {
  calculateAmount,
  calculateDistance,
  checkPaymentMethod,
} from "@/lib/utils/methods";

// Assets
// Adjusted paths for web/app/(localized)/order/checkout/page.tsx
import HomeIcon from "../../../../assets/home_icon.png";
import RestIcon from "../../../../assets/rest_icon.png";
import { onUseLocalStorage } from "@/lib/utils/methods/local-storage";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { darkMapStyle } from "@/lib/utils/mapStyles/mapStyle";
import { GET_TIPS } from "@/lib/api/graphql/queries/tipping";

//Coupon localStorage Keys
const COUPON_STORAGE_KEY = "applied_coupon";
const COUPON_TEXT_STORAGE_KEY = "coupon_text";
const COUPON_APPLIED_STORAGE_KEY = "is_coupon_applied";
const COUPON_RESTAURANT_KEY = "coupon_restaurant_id";

export default function OrderCheckoutPage() {
  const t = useTranslations();
  const [isAddressSelectedOnce, setIsAddressSelectedOnce] = useState(false);
  const [isUserAddressModalOpen, setIsUserAddressModalOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState("Delivery");
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [isPickUp, setIsPickUp] = useState(false);
  const [selectedTip, setSelectedTip] = useState("");
  const [distance, setDistance] = useState("0.0");
  const [shouldLeaveAtDoor, setShouldLeaveAtDoor] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(
    PAYMENT_METHOD_LIST[0].value,
  );
  const [taxValue, setTaxValue] = useState<number>();
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [isCheckingCache, setIsCheckingCache] = useState(true);

  // Coupon
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponText, setCouponText] = useState("");
  const [coupon, setCoupon] = useState<ICouponData | null>(null);

  // Hooks
  const router = useRouter();
  const { CURRENCY_SYMBOL, CURRENCY, DELIVERY_RATE, COST_TYPE, SERVER_URL } =
    useConfig();
  const { authToken, setIsAuthModalVisible } = useAuth();
  const { showToast } = useToast();

  const {
    cart,
    restaurant: restaurantId,
    clearCart,
    profile,
    fetchProfile,
    loadingProfile,
  } = useUser();

  const { userAddress } = useUserAddress();
  const restaurantFromLocalStorage = typeof window !== 'undefined' ? localStorage.getItem("restaurant") : null;
  const { data: restaurantData } = useRestaurant(restaurantId || "") || {
    data: restaurantFromLocalStorage
      ? JSON.parse(restaurantFromLocalStorage)
      : null,
    loading: false,
  };

  const [localRestaurantData, setLocalRestaurantData] = useState<any>(null);

  useEffect(() => {
    if (!restaurantData && restaurantFromLocalStorage) {
      try {
        const restaurantDataStr =
          localStorage.getItem("restaurantData") || "{}";
        const parsedData = JSON.parse(restaurantDataStr);
        setLocalRestaurantData(parsedData);
      } catch (error) {
        console.error(
          "Error parsing restaurant data from localStorage:",
          error,
        );
      }
    }
  }, [restaurantData, restaurantFromLocalStorage]);

  function couponCompleted({ coupon }: { coupon: ICoupon }) {
    if (!coupon.success) {
      showToast({
        type: "info",
        title: t("coupon_not_found_title"),
        message: `${couponText} ${t("coupon_is_not_valid_message_with_title")}`,
      });
    } else if (coupon.coupon) {
      if (coupon.coupon.enabled) {
        showToast({
          type: "info",
          title: t("coupon_applied_title"),
          message: `${coupon.coupon.title} ${t("coupon_has_been_applied_message")}`,
        });
        setIsCouponApplied(true);
        setCoupon(coupon.coupon);

        onUseLocalStorage(
          "save",
          COUPON_STORAGE_KEY,
          JSON.stringify(coupon.coupon),
        );
        onUseLocalStorage("save", COUPON_TEXT_STORAGE_KEY, couponText);
        onUseLocalStorage("save", COUPON_APPLIED_STORAGE_KEY, "true");
        onUseLocalStorage("save", COUPON_RESTAURANT_KEY, restaurantId || "");
      } else {
        showToast({
          type: "info",
          title: t("coupon_not_found_title"),
          message: `${coupon.coupon.title} ${t("coupon_is_not_valid_message_with_title")}`,
        });
      }
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && isCouponApplied && restaurantId) {
      const savedRestaurantId = onUseLocalStorage("get", COUPON_RESTAURANT_KEY);

      if (savedRestaurantId && savedRestaurantId !== restaurantId) {
        setIsCouponApplied(false);
        setCoupon({} as ICouponData);
        setCouponText("");

        onUseLocalStorage("delete", COUPON_STORAGE_KEY);
        onUseLocalStorage("delete", COUPON_TEXT_STORAGE_KEY);
        onUseLocalStorage("delete", COUPON_APPLIED_STORAGE_KEY);
        onUseLocalStorage("delete", COUPON_RESTAURANT_KEY);

        showToast({
          type: "info",
          title: t("coupon_removed_title"),
          message: t("coupon_removed_different_restaurant"),
        });
      }
    }
  }, [restaurantId, isCouponApplied, showToast, t]);

  useEffect(() => {
    if (typeof window !== "undefined" && restaurantId) {
      const savedCouponData = onUseLocalStorage("get", COUPON_STORAGE_KEY);
      const savedCouponText = onUseLocalStorage("get", COUPON_TEXT_STORAGE_KEY);
      const savedCouponApplied = onUseLocalStorage(
        "get",
        COUPON_APPLIED_STORAGE_KEY,
      );
      const savedRestaurantId = onUseLocalStorage("get", COUPON_RESTAURANT_KEY);

      if (savedCouponData && savedCouponText && savedCouponApplied === "true") {
        if (savedRestaurantId === restaurantId) {
          try {
            const parsedCoupon = JSON.parse(savedCouponData);
            setCoupon(parsedCoupon);
            setCouponText(savedCouponText);
            setIsCouponApplied(true);
          } catch (error) {
            onUseLocalStorage("delete", COUPON_STORAGE_KEY);
            onUseLocalStorage("delete", COUPON_TEXT_STORAGE_KEY);
            onUseLocalStorage("delete", COUPON_APPLIED_STORAGE_KEY);
            onUseLocalStorage("delete", COUPON_RESTAURANT_KEY);
          }
        } else {
          onUseLocalStorage("delete", COUPON_STORAGE_KEY);
          onUseLocalStorage("delete", COUPON_TEXT_STORAGE_KEY);
          onUseLocalStorage("delete", COUPON_APPLIED_STORAGE_KEY);
          onUseLocalStorage("delete", COUPON_RESTAURANT_KEY);
        }
      }
    }
  }, [restaurantId]);

  useEffect(() => {
    if (isCouponApplied && cart.length === 0) {
      setIsCouponApplied(false);
      setCoupon({} as ICouponData);
      setCouponText("");
      onUseLocalStorage("delete", COUPON_STORAGE_KEY);
      onUseLocalStorage("delete", COUPON_TEXT_STORAGE_KEY);
      onUseLocalStorage("delete", COUPON_APPLIED_STORAGE_KEY);
    }
  }, [cart.length, isCouponApplied]);

  const finalRestaurantData = restaurantData || localRestaurantData;
  const { isLoaded } = useContext(GoogleMapsContext);

  const origin = {
    lat: Number(finalRestaurantData?.restaurant?.location?.coordinates?.[1]) || 0,
    lng: Number(finalRestaurantData?.restaurant?.location?.coordinates?.[0]) || 0,
  };

  const destination = {
    lat: Number(userAddress?.location?.coordinates?.[1]) || 0,
    lng: Number(userAddress?.location?.coordinates?.[0]) || 0,
  };
  const store_user_location_cache_key = `${origin?.lat},${origin?.lng}_${destination?.lat},${destination?.lng}`;

  const [orderInstructions, setOrderInstructions] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const stored = localStorage.getItem("newOrderInstructions");
    setOrderInstructions(stored);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "newOrderInstructions") {
        setOrderInstructions(event.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const { data: tipData } = useQuery(GET_TIPS);
  const [placeOrder, { loading: loadingOrderMutation }] = useMutation(
    PLACE_ORDER,
    {
      onCompleted,
      onError,
      update,
    },
  );
  const [verifyCoupon, { loading: couponLoading }] = useMutation(
    VERIFY_COUPON,
    {
      onCompleted: couponCompleted,
    },
  );

  const onInit = () => {
    if (!finalRestaurantData) return;
    setTaxValue(finalRestaurantData?.restaurant?.tax);
    onInitDeliveryCharges();
  };

  useEffect(() => {
    if (finalRestaurantData?.restaurant?.tax !== undefined) {
      setTaxValue(finalRestaurantData.restaurant.tax);
    }
  }, [finalRestaurantData]);

  const onInitDirectionCacheSet = () => {
    try {
      const stored_direction = onUseLocalStorage("get", store_user_location_cache_key);
      if (stored_direction) {
        setDirections(JSON.parse(stored_direction));
      } else {
        setDirections(null);
      }
      setIsCheckingCache(false);
    } catch (err) {
      setDirections(null);
      setIsCheckingCache(false);
    }
  };

  const onInitDeliveryCharges = () => {
    const latOrigin = Number(finalRestaurantData?.restaurant?.location?.coordinates?.[1]) || 0;
    const lonOrigin = Number(finalRestaurantData?.restaurant?.location?.coordinates?.[0]) || 0;
    const latDest = userAddress?.location?.coordinates?.[1] || 0;
    const longDest = userAddress?.location?.coordinates?.[0] || 0;

    const distance = calculateDistance(latOrigin, lonOrigin, latDest, longDest);
    let amount = calculateAmount(COST_TYPE as OrderTypes.TCostType, DELIVERY_RATE, distance);
    setDistance(distance.toFixed(2));
    setDeliveryCharges(amount > 0 ? amount : DELIVERY_RATE);
  };

  function transformOrder(cartData: CartItem[]) {
    return cartData.map((food) => ({
      food: food._id,
      quantity: food.quantity,
      variation: food.variation._id,
      addons: food.addons
        ? food.addons.map(({ _id, options }) => ({
          _id,
          options: options.map(({ _id }) => _id),
        }))
        : [],
      specialInstructions: food.specialInstructions,
    }));
  }

  const onCheckIsOpen = () => {
    if (!finalRestaurantData?.restaurant) return false;
    const date = new Date();
    const day = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const todaysTimings = finalRestaurantData.restaurant.openingTimes?.find(
      (o: any) => o.day === DAYS[day],
    );
    if (!todaysTimings) return false;
    const times = todaysTimings.times.filter(
      (t: any) =>
        hours >= Number(t.startTime[0]) &&
        minutes >= Number(t.startTime[1]) &&
        hours <= Number(t.endTime[0]) &&
        minutes <= Number(t.endTime[1]),
    );
    return times.length > 0;
  };

  const onApplyCoupon = () => {
    verifyCoupon({
      variables: { coupon: couponText, restaurantId: restaurantId },
    });
  };

  const isWithinOpeningTime = (openingTimes: IOpeningTime[]): boolean => {
    const now = new Date();
    const currentDay = now.toLocaleString("en-US", { weekday: "short" }).toUpperCase();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const todayOpening = openingTimes.find((ot) => ot.day === currentDay);
    if (!todayOpening) return false;
    return todayOpening.times.some(({ startTime, endTime }) => {
      const [startHour, startMinute] = startTime.map(Number);
      const [endHour, endMinute] = endTime.map(Number);
      const startTotal = startHour * 60 + startMinute;
      const endTotal = endHour * 60 + endMinute;
      const nowTotal = currentHour * 60 + currentMinute;
      return nowTotal >= startTotal && nowTotal <= endTotal;
    });
  };

  function validateOrder() {
    if (!finalRestaurantData?.restaurant) {
      showToast({ title: t("restaurant_label"), message: t("restaurant_data_not_loaded"), type: "error" });
      return false;
    }
    if (!finalRestaurantData.restaurant.isAvailable || !finalRestaurantData.restaurant.isActive ||
      !isWithinOpeningTime(finalRestaurantData.restaurant.openingTimes) || !onCheckIsOpen()) {
      showToast({ title: t("restaurant_label"), message: t("restaurant_unavailable"), type: "error" });
      return false;
    }
    if (!cart.length) {
      showToast({ title: "Cart", message: "Cart is empty", type: "error" });
      return false;
    }
    const delivery = isPickUp ? 0 : deliveryCharges;
    if (Number(calculatePrice(delivery, true)) < (finalRestaurantData.restaurant.minimumOrder || 0)) {
      showToast({ title: t("minimum_amount"), message: ` ${t("The_minimum_amount_of_(")} ${CURRENCY_SYMBOL} ${finalRestaurantData.restaurant.minimumOrder || 0} ${t(")_for_your_order_has_not_been_reached")}`, type: "warn" });
      return false;
    }
    if (!userAddress) {
      showToast({ title: t("missing_address"), message: t("Select_your_address"), type: "warn" });
      return false;
    }
    if (!paymentMethod) {
      showToast({ title: "Missing Payment Method", message: "Set payment method before checkout", type: "warn" });
      return false;
    }
    if (loadingProfile) {
      showToast({ title: "Loading Profile", message: "Please wait while we load your profile information.", type: "info" });
      return false;
    }
    if (!profile) {
      showToast({ title: "Missing Profile", message: "Your profile information couldn't be loaded.", type: "error" });
      fetchProfile();
      return false;
    }
    if (!profile.phone || profile.phone.length < 1) {
      showToast({ title: t("Missing_Phone_number"), message: t("Phone_number_is_missing"), type: "warn" });
      return false;
    }
    if (!profile.phoneIsVerified) {
      showToast({ title: t("Unverified_Phone_number"), message: t("Phone_Number_is_not_verified"), type: "warn" });
      return false;
    }
    return true;
  }

  async function onPlaceOrder() {
    if (!authToken) { setIsAuthModalVisible(true); return; }
    if (!validateOrder()) return;
    if (!isAddressSelectedOnce && deliveryType === "Delivery") { setIsUserAddressModalOpen(true); return; }

    if (checkPaymentMethod(CURRENCY, paymentMethod)) {
      const items = transformOrder(cart);
      placeOrder({
        variables: {
          restaurant: restaurantId,
          orderInput: items,
          instructions: localStorage.getItem("newOrderInstructions") || "",
          paymentMethod: paymentMethod,
          couponCode: isCouponApplied ? (coupon ? coupon.title : null) : null,
          tipping: +selectedTip,
          taxationAmount: +taxCalculation(),
          address: {
            label: userAddress?.label,
            deliveryAddress: userAddress?.deliveryAddress,
            details: userAddress?.details,
            longitude: "" + userAddress?.location?.coordinates[0],
            latitude: "" + userAddress?.location?.coordinates[1],
          },
          orderDate: new Date(),
          isPickedUp: isPickUp,
          deliveryCharges: isPickUp ? 0 : deliveryCharges,
        },
      });
    } else {
      showToast({ title: "Unsupported Payment Method", message: "Payment method not supported", type: "warn" });
    }
  }

  async function onCompleted(data: { placeOrder: IOrder }) {
    localStorage.removeItem("orderInstructions");
    clearCart();
    onUseLocalStorage("delete", COUPON_STORAGE_KEY);
    onUseLocalStorage("delete", COUPON_TEXT_STORAGE_KEY);
    onUseLocalStorage("delete", COUPON_APPLIED_STORAGE_KEY);
    onUseLocalStorage("delete", COUPON_RESTAURANT_KEY);
    if (paymentMethod === "COD") {
      router.replace(`/order/${data.placeOrder._id}/tracking`);
    } else if (paymentMethod === "PAYPAL") {
      router.replace(`/paypal?id=${data.placeOrder._id}`);
    } else if (paymentMethod === "STRIPE") {
      router.replace(`${SERVER_URL}stripe/create-checkout-session?id=${data?.placeOrder?.orderId}&platform=web`);
    }
  }

  function update(cache: ApolloCache<any>, { data }: { data?: { placeOrder: IOrder } }) {
    const placeOrder = data?.placeOrder;
    if (placeOrder && placeOrder.paymentMethod === "COD") {
      const ordersData = cache.readQuery({ query: ORDERS }) as { orders: IOrder[] };
      if (ordersData) {
        cache.writeQuery({ query: ORDERS, data: { orders: [placeOrder, ...ordersData.orders] } });
      }
    }
  }

  function onError(error: ApolloError) {
    showToast({ title: "Error", message: error.graphQLErrors[0]?.message || error?.networkError?.message || "Something went wrong", type: "error" });
  }

  function calculatePrice(delivery = 0, withDiscount: boolean = false) {
    let itemTotal: number = 0;
    cart.forEach((cartItem) => {
      itemTotal = itemTotal + Number(cartItem?.price || 0) * cartItem.quantity;
    });
    if (withDiscount && coupon && coupon.discount && isCouponApplied) {
      itemTotal = itemTotal - (coupon.discount / 100) * itemTotal;
    }
    const deliveryAmount = delivery > 0 ? deliveryCharges : 0;
    return (itemTotal + deliveryAmount).toFixed(2);
  }

  function taxCalculation() {
    const tax = taxValue ?? 0;
    if (tax === 0) return tax.toFixed(2);
    const delivery = isPickUp ? 0 : deliveryCharges;
    const amount = +calculatePrice(delivery, true);
    return ((amount / 100) * tax).toFixed(2);
  }

  function calculateTotal() {
    let total: number = 0;
    const delivery = isPickUp ? 0 : deliveryCharges;
    total += +calculatePrice(delivery, true);
    total += +taxCalculation();
    total += selectedTip ? Number(selectedTip) : 0;
    return total.toFixed(2);
  }

  const directionsCallback = useCallback((result: google.maps.DirectionsResult | null, status: string) => {
    if (status === "OK" && result) {
      setDirections(result);
      onUseLocalStorage("save", store_user_location_cache_key, JSON.stringify(result));
    }
  }, [store_user_location_cache_key]);

  const filteredPaymentMethods = !finalRestaurantData?.restaurant?.stripeDetailsSubmitted
    ? PAYMENT_METHOD_LIST.filter((method) => method.value === "COD")
    : PAYMENT_METHOD_LIST;

  useEffect(() => { if (finalRestaurantData?.restaurant) onInit(); }, [finalRestaurantData]);
  useEffect(() => { onInitDirectionCacheSet(); }, [store_user_location_cache_key]);

  return (
    <>
      <div className="relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "35vh" }}
            options={{ styles: theme === "dark" ? darkMapStyle : null, disableDefaultUI: true }}
            center={{ lat: 24.8607, lng: 67.0011 }}
            zoom={13}
          >
            <Marker position={origin} icon={{ url: RestIcon.src, scaledSize: new window.google.maps.Size(40, 40) }} />
            <Marker position={destination} icon={{ url: HomeIcon.src, scaledSize: new window.google.maps.Size(40, 40) }} />
            {!directions && !isCheckingCache && (
              <DirectionsService
                options={{ destination, origin, travelMode: google.maps.TravelMode.DRIVING }}
                callback={directionsCallback}
              />
            )}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{ directions, suppressMarkers: true, polylineOptions: { strokeColor: "#5AC12F", strokeOpacity: 0.8, strokeWeight: 3, zIndex: 10 } }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">Loading Map...</div>
        )}
      </div>

      <PaddingContainer className="pb-10">
        <div className="max-w-6xl md:pt-10 p-4 md:p-0 lg:flex lg:space-x-4">
          <div className="lg:w-2/3">
            <div className="flex justify-between bg-gray-100 dark:bg-gray-800 rounded-full p-2 mb-6">
              <button className={`w-1/2 py-2 rounded-full ${deliveryType === "Delivery" ? "bg-primary-color text-white" : "text-gray-500"}`} onClick={() => { setDeliveryType("Delivery"); setIsPickUp(false); }}>{t("delivery_label")}</button>
              <button className={`w-1/2 py-2 rounded-full ${deliveryType === "Pickup" ? "bg-primary-color text-white" : "text-gray-500"}`} onClick={() => { setDeliveryType("Pickup"); setIsPickUp(true); }}>{t("pickup_label")}</button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-4">
              <h3 className="font-semibold mb-2">{t("delivery_details")}</h3>
              <p>{userAddress?.deliveryAddress}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-4">
              <h3 className="font-semibold mb-2">{t("selected_items_label")}</h3>
              {cart.map((item) => (
                <div key={item._id} className="flex justify-between mb-2">
                  <span>{item.foodTitle} x {item.quantity}</span>
                  <span>{CURRENCY_SYMBOL}{item.price}</span>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-4">
              <h3 className="font-semibold mb-2">{t("payment_method")}</h3>
              {filteredPaymentMethods.map((m) => (
                <div key={m.value} className="flex items-center mb-2">
                  <input type="radio" checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} />
                  <span className="ml-2">{t(m.label)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border sticky top-20">
              <h2 className="text-xl font-bold mb-4">{t("order_summary")}</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between"><span>{t("subtotal")}</span><span>{CURRENCY_SYMBOL}{calculatePrice(0)}</span></div>
                {deliveryType === "Delivery" && <div className="flex justify-between"><span>{t("delivery_fee")}</span><span>{CURRENCY_SYMBOL}{deliveryCharges}</span></div>}
                <div className="flex justify-between"><span>{t("tax")}</span><span>{CURRENCY_SYMBOL}{taxCalculation()}</span></div>
                {isCouponApplied && <div className="flex justify-between text-green-500"><span>{t("discount")}</span><span>-{CURRENCY_SYMBOL}{(Number(calculatePrice(0, false)) - Number(calculatePrice(0, true))).toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>{t("total")}</span><span>{CURRENCY_SYMBOL}{calculateTotal()}</span></div>
              </div>
              <button className="w-full bg-primary-color py-3 rounded-full font-bold disabled:opacity-50" onClick={onPlaceOrder} disabled={loadingOrderMutation || cart.length === 0}>
                {loadingOrderMutation ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : null}
                {t("place_order")}
              </button>
            </div>
          </div>
        </div>
      </PaddingContainer>

      <UserAddressComponent visible={isUserAddressModalOpen} onHide={() => { setIsUserAddressModalOpen(false); setIsAddressSelectedOnce(true); }} />
    </>
  );
}
