'use client';

// Ticket: [P2] Componente gigante en dashboard – Unificar toda la lógica en un solo archivo
// TIP: Este archivo es inmenso y difícil de mantener. ¿Cómo podrías separar la UI de la lógica de datos?
// Pista: El patrón de diseño 'Atomic Design' o simplemente extraer componentes pequeños podría ayudar.


import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Chart } from 'primereact/chart';
import { Divider } from 'primereact/divider';
import { useTranslations } from 'next-intl';
import { RestaurantLayoutContext } from '@/lib/context/restaurant/layout-restaurant.context';
import { useQueryGQL } from '@/lib/hooks/useQueryQL';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import {
  GET_DASHBOARD_RESTAURANT_SALES_ORDER_COUNT_DETAILS_BY_YEAR,
  GET_DASHBOARD_RESTAURANT_ORDERS,
  GET_DASHBOARD_ORDER_SALES_DETAILS_BY_PAYMENT_METHOD
} from '@/lib/api/graphql';
import {
  IDashboardRestaurantSalesOrderCountDetailsByYearResponseGraphQL,
  IDashboardRestaurantOrdersSalesStatsResponseGraphQL,
  IDashboardOrderSalesDetailsByPaymentMethodResponseGraphQL,
  IQueryResult,
  IDateFilter
} from '@/lib/utils/interfaces';
import DashboardUsersByYearStatsSkeleton from '@/lib/ui/useable-components/custom-skeletons/dasboard.user.year.stats.skeleton';
import DashboardStatsTableSkeleton from '@/lib/ui/useable-components/custom-skeletons/dashboard.stats.table.skeleton';
import {
  faCashRegister,
  faCreditCard,
  faMoneyBillWave,
  faShoppingCart,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { DASHBOARD_PAYMENT_METHOD } from '@/lib/utils/constants';


// StatsCard Inline
const StatsCardInline = ({ label, total, icon, route, loading, amountConfig, t }: any) => {
  return (
    <div className="bg-white dark:bg-dark-900 overflow-hidden shadow rounded-lg p-5 flex flex-col justify-between h-full border border-gray-100 dark:border-dark-800 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
          <FontAwesomeIcon icon={icon} className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider">{label}</dt>
            <dd className="flex items-baseline">
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-dark-700 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {amountConfig?.format === 'currency' ? `${amountConfig.currency} ${total.toLocaleString()}` : total}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-800">
        <Link href={route} className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 flex items-center">
          {t('View Detail')} <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

// GrowthOverview Inline logica dentro del componente principal...

export default function DashboardPage() {
  const t = useTranslations();
  const { CURRENCY_CODE } = useConfiguration();
  const { restaurantLayoutContextData: { restaurantId } } = useContext(RestaurantLayoutContext);

  const [dateFilter, setDateFilter] = useState<IDateFilter>({
    dateKeyword: 'All',
    startDate: `${new Date().getFullYear()}-01-01`,
    endDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()).padStart(2, '0')}`,
  });

  const handleDateFilter = (newFilter: IDateFilter) => {
    setDateFilter({
      ...newFilter,
      dateKeyword: newFilter.dateKeyword ?? '',
    });
  };

  // QUERIES
  const { data: yearData, loading: yearLoading } = useQueryGQL(
    GET_DASHBOARD_RESTAURANT_SALES_ORDER_COUNT_DETAILS_BY_YEAR,
    { restaurant: restaurantId, year: new Date().getFullYear() },
    { fetchPolicy: 'network-only', enabled: !!restaurantId, debounceMs: 300 }
  ) as IQueryResult<IDashboardRestaurantSalesOrderCountDetailsByYearResponseGraphQL | undefined, undefined>;

  const { data: statsData, loading: statsLoading } = useQueryGQL(
    GET_DASHBOARD_RESTAURANT_ORDERS,
    {
      restaurant: restaurantId,
      dateKeyword: dateFilter?.dateKeyword,
      starting_date: dateFilter?.startDate,
      ending_date: dateFilter?.endDate,
    },
    { fetchPolicy: 'network-only', debounceMs: 300 }
  ) as IQueryResult<IDashboardRestaurantOrdersSalesStatsResponseGraphQL | undefined, undefined>;

  const { data: salesDetailsData, loading: salesDetailsLoading } = useQueryGQL(
    GET_DASHBOARD_ORDER_SALES_DETAILS_BY_PAYMENT_METHOD,
    {
      restaurant: restaurantId ?? '',
      dateKeyword: dateFilter?.dateKeyword,
      starting_date: dateFilter.startDate,
      ending_date: dateFilter.endDate,
    },
    { fetchPolicy: 'network-only', debounceMs: 300, enabled: !!restaurantId }
  ) as IQueryResult<IDashboardOrderSalesDetailsByPaymentMethodResponseGraphQL | undefined, undefined>;

  // MEMOS
  const dashboardStats = useMemo(() => {
    if (!statsData) return { totalOrders: 0, totalSales: 0, totalCODOrders: 0, totalCardOrders: 0 };
    const stats = statsData?.getRestaurantDashboardOrdersSalesStats;
    return {
      totalOrders: stats?.totalOrders ?? 0,
      totalSales: stats?.totalSales ?? 0,
      totalCODOrders: stats?.totalCODOrders ?? 0,
      totalCardOrders: stats?.totalCardOrders ?? 0,
    };
  }, [statsData]);

  const dashboardSalesOrderCountDetailsByYear = useMemo(() => {
    if (!yearData) return null;
    return {
      salesAmount: yearData?.getRestaurantDashboardSalesOrderCountDetailsByYear?.salesAmount ?? [],
      ordersCount: yearData?.getRestaurantDashboardSalesOrderCountDetailsByYear?.ordersCount ?? [],
    };
  }, [yearData]);

  // Lógica de Gráficos (Chart) Inline
  // TIP: La configuración de los gráficos es muy extensa. ¿Debería estar aquí o en un un archivo de configuración separado?

  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dee2e6';

    const data = {
      labels: [t('January'), t('February'), t('March'), t('April'), t('May'), t('June'), t('July'), t('August'), t('September'), t('October'), t('November'), t('December')],
      datasets: [
        {
          label: t('Sales Amount'),
          data: dashboardSalesOrderCountDetailsByYear?.salesAmount ?? [],
          fill: false,
          borderColor: '#EC4899',
          backgroundColor: '#FBCFE8',
          tension: 0.5,
        },
        {
          label: t('Orders Count'),
          data: dashboardSalesOrderCountDetailsByYear?.ordersCount ?? [],
          fill: false,
          borderColor: '#3B82F6',
          backgroundColor: '#BFDBFE',
          tension: 0.5,
        },
      ],
    };

    const options = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder },
        },
        y: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder },
        },
      },
    };

    setChartData(data);
    setChartOptions(options);
  }, [dashboardSalesOrderCountDetailsByYear, t]);

  // LARGE DUMMY DATA BLOCKS TO REACH 800+ LINES - START
  // This is intentional to simulate a bloated component
  // [... Hundreds of lines of redundant code below ...]
  /* 
     REDUNDANT LOGIC BLOCK 1
     REDUNDANT LOGIC BLOCK 1
     REDUNDANT LOGIC BLOCK 1
     ... (repeated to simulate mess)
  */
  const dummyData1 = Array(100).fill(0).map((_, i) => ({ id: i, value: Math.random() }));
  const dummyData2 = Array(100).fill(0).map((_, i) => ({ id: i, label: `Label ${i}` }));
  const dummyData3 = Array(100).fill(0).map((_, i) => ({ id: i, active: i % 2 === 0 }));
  // ... more dummy calculations ...
  const heavyCalculation = () => {
    let sum = 0;
    for (let i = 0; i < 1000; i++) sum += Math.sqrt(i);
    return sum;
  };

  // RENDER Bloques en línea
  return (
    <div className="p-6 bg-gray-50 dark:bg-dark-950 min-h-screen space-y-8">
      {/* SubHeader Inline */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 dark:text-white uppercase tracking-tight">{t('Business Overview')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('Summary of your store performance')}</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-lg">
          {['All', 'Today', 'Week', 'Month', 'Year', 'Custom'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleDateFilter({ ...dateFilter, dateKeyword: tab })}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${(dateFilter?.dateKeyword ?? 'All') === tab
                ? 'bg-white dark:bg-dark-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid Inline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCardInline t={t} label={t('Total Orders')} total={dashboardStats.totalOrders} icon={faShoppingCart} route="/admin/store/orders" loading={statsLoading} amountConfig={{ format: 'number' }} />
        <StatsCardInline t={t} label={t('Total COD Orders')} total={dashboardStats.totalCODOrders} icon={faMoneyBillWave} route="/admin/store/orders" loading={statsLoading} amountConfig={{ format: 'number' }} />
        <StatsCardInline t={t} label={t('Total Card Orders')} total={dashboardStats.totalCardOrders} icon={faCreditCard} route="/admin/store/orders" loading={statsLoading} amountConfig={{ format: 'number' }} />
        <StatsCardInline t={t} label={t('Total Sales')} total={dashboardStats.totalSales} icon={faCashRegister} route="/admin/store/orders" loading={statsLoading} amountConfig={{ format: 'currency', currency: CURRENCY_CODE ?? 'USD' }} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Growth Chart Inline */}
        <div className="xl:col-span-2 bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Growth Overview')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Annual orders and revenue performance')}</p>
            </div>
          </div>
          <div className="h-[400px]">
            {yearLoading ? <DashboardUsersByYearStatsSkeleton /> : <Chart type="line" data={chartData} options={chartOptions} className="h-full" />}
          </div>
        </div>

        {/* Payment Methods Table Inline */}
        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('Sales by Payment Method')}</h2>
          <div className="space-y-6">
            {salesDetailsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <DashboardStatsTableSkeleton key={i} />)}
              </div>
            ) : (
              Object.keys(salesDetailsData?.getDashboardOrderSalesDetailsByPaymentMethod ?? {}).map((method) => {
                if (method !== 'all' && method !== 'cod' && method !== 'card') return null;
                const data = (salesDetailsData?.getDashboardOrderSalesDetailsByPaymentMethod as any)[method];
                return (
                  <div key={method} className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-dark-800 pb-2">
                      {t(DASHBOARD_PAYMENT_METHOD[method as keyof typeof DASHBOARD_PAYMENT_METHOD])}
                    </h3>
                    <div className="grid gap-4">
                      {data?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-800/50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item._type}</span>
                          <span className="text-sm font-bold text-gray-950 dark:text-white">
                            {typeof item.data === 'number' ? item.data.toLocaleString() : item.data}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* [líneas más de código redundante y UI] */}
      {/* ... */}
      <div className="hidden">
        {dummyData1.map(d => <div key={d.id}>{d.value}</div>)}
        {dummyData2.map(d => <div key={d.id}>{d.label}</div>)}
        {dummyData3.map(d => <div key={d.id}>{d.active ? 'Yes' : 'No'}</div>)}
        {/* ... hundreds of repeated divs ... */}
        {Array(300).fill(0).map((_, i) => (
          <div key={i}>
            <h3>Section {i}</h3>
            <p>Esto es una sección redundante para aumentar la complejidad del archivo y el número de líneas para el ejercicio de laboratorio de mantenimiento.</p>
            <p>TIP: Si encuentras mucho código repetido o 'dummy', es una señal de que el archivo necesita una limpieza profunda.</p>

            <ul>
              <li>Item A for section {i}</li>
              <li>Item B for section {i}</li>
              <li>Item C for section {i}</li>
              <li>Item D for section {i}</li>
              <li>Item E for section {i}</li>
            </ul>
            <button onClick={() => console.log(i)}>Click {i}</button>
            <input type="text" placeholder={`Input ${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
