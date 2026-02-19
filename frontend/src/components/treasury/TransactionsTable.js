import React from 'react';
import { TableVirtuoso } from 'react-virtuoso';

/**
 * Component for treasury transactions table - Tailwind CSS version
 */
function TransactionsTable({ transactions = [], formatDate, formatCurrency, onRefresh }) {
    // Ensure transactions is always an array
    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    // Safe wrapper functions with fallbacks
    const safeFormatDate = (date) => {
        if (typeof formatDate === 'function') return formatDate(date);
        return date ? new Date(date).toLocaleDateString('en-US') : '-';
    };

    const safeFormatCurrency = (amount) => {
        if (typeof formatCurrency === 'function') return formatCurrency(amount);
        return `${(parseFloat(amount) || 0).toLocaleString('en-US')} ج.م`;
    };

    const MobileTransactionCard = ({ transaction }) => (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 p-3.5 space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${transaction.type === 'IN'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'
                        }`}>
                        {transaction.type === 'IN' ? <i className="bi bi-arrow-down-short me-1"></i> : <i className="bi bi-arrow-up-short me-1"></i>}
                        {transaction.type === 'IN' ? 'وارد' : 'صادر'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {safeFormatDate(transaction.date)}
                    </span>
                </div>
                <div className={`text-sm font-bold whitespace-nowrap tabular-nums ${transaction.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {transaction.type === 'IN' ? '+' : '-'}{safeFormatCurrency(transaction.amount).replace('ج.م', '')} <span className="text-xs font-normal text-gray-400">ج.م</span>
                </div>
            </div>

            <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                {transaction.description}
            </div>

            <div className="pt-2 border-t border-gray-50 dark:border-slate-700/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-500 me-2"></div>
                    <span className="truncate max-w-[200px] font-medium text-gray-700 dark:text-gray-300" title={transaction.account_name || 'عام'}>
                        {transaction.account_name || 'عام'}
                    </span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="font-mono text-[10px]">{transaction.source}</span>
                </div>
            </div>
        </div>
    );

    const fixedHeaderContent = () => (
        <tr className="bg-gray-50/95 dark:bg-slate-700/95 backdrop-blur-sm shadow-sm">
            <th className="w-[15%] px-4 py-3.5 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">التاريخ</th>
            <th className="w-[30%] px-4 py-3.5 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">الوصف</th>
            <th className="w-[12%] px-4 py-3.5 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">النوع</th>
            <th className="w-[23%] px-4 py-3.5 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">الحساب / الجهة</th>
            <th className="w-[20%] px-4 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">المبلغ</th>
        </tr>
    );

    const rowContent = (_index, t) => {
        return (
            <>
                <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap tabular-nums font-medium">
                    {safeFormatDate(t.date)}
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-800 dark:text-gray-200">
                    <div className="line-clamp-1" title={t.description}>
                        {t.description}
                    </div>
                </td>
                <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${t.type === 'IN'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'
                        }`}>
                        {t.type === 'IN' ? <i className="bi bi-arrow-down-short me-1"></i> : <i className="bi bi-arrow-up-short me-1"></i>}
                        {t.type === 'IN' ? 'وارد' : 'صادر'}
                    </span>
                </td>
                <td className="px-4 py-3.5">
                    <div className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-500 me-2"></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[150px]" title={t.account_name || 'عام'}>
                                {t.account_name || 'عام'}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono hidden group-hover:block">
                                {t.source}
                            </span>
                        </div>
                    </div>
                </td>
                <td className={`px-4 py-3.5 text-left text-sm font-bold whitespace-nowrap tabular-nums ${t.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                    {t.type === 'IN' ? '+' : '-'}{safeFormatCurrency(t.amount).replace('ج.م', '')} <span className="text-xs font-normal text-gray-400">ج.م</span>
                </td>
            </>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 sticky top-0 z-20">
                <h5 className="font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <i className="bi bi-clock-history text-emerald-500 me-2"></i>
                    سجل الحركات الأخيرة
                </h5>
                <button
                    className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 text-xs font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    onClick={onRefresh}
                >
                    <i className="bi bi-arrow-clockwise text-lg leading-none"></i>
                    <span>تحديث</span>
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block flex-1 min-h-[500px]">
                {safeTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 h-full">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                            <i className="bi bi-inbox text-2xl"></i>
                        </div>
                        <p className="text-sm">لا يوجد حركات مسجلة</p>
                    </div>
                ) : (
                    <TableVirtuoso
                        style={{ height: '100%', width: '100%' }}
                        data={safeTransactions}
                        fixedHeaderContent={fixedHeaderContent}
                        itemContent={rowContent}
                        components={{
                            Table: ({ style, ...props }) => (
                                <table
                                    {...props}
                                    style={{ ...style, width: '100%', minWidth: '100%', borderCollapse: 'collapse' }}
                                    className="min-w-full divide-y divide-gray-100 dark:divide-slate-700 relative"
                                />
                            ),
                            TableBody: React.forwardRef(({ style, ...props }, ref) => (
                                <tbody
                                    {...props}
                                    ref={ref}
                                    style={{ ...style }}
                                    className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700"
                                />
                            )),
                            TableRow: (props) => (
                                <tr
                                    {...props}
                                    className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors group"
                                />
                            )
                        }}
                    />
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col p-4 space-y-3 bg-gray-50 dark:bg-slate-800/50 max-h-[500px] overflow-y-auto">
                {safeTransactions.length > 0 ? (
                    safeTransactions.map((t) => <MobileTransactionCard key={t.transaction_id} transaction={t} />)
                ) : (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                                <i className="bi bi-inbox text-2xl"></i>
                            </div>
                            <p className="text-sm">لا يوجد حركات مسجلة</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TransactionsTable;
