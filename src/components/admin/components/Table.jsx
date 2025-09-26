import React from 'react';

const Table = ({ 
  headers, 
  children, 
  className = "",
  emptyMessage = "No data found",
  emptyMessageColSpan = 1 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
          <tr>
            {headers.map((header, index) => (
              <th 
                key={index}
                className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {children}
        </tbody>
      </table>
    </div>
  );
};

const TableRow = ({ children, className = "" }) => (
  <tr className={className}>
    {children}
  </tr>
);

const TableCell = ({ 
  children, 
  className = "px-4 sm:px-6 py-4 text-sm text-gray-900",
  colSpan 
}) => (
  <td className={className} colSpan={colSpan}>
    {children}
  </td>
);

const EmptyTableRow = ({ message, colSpan }) => (
  <tr>
    <TableCell colSpan={colSpan} className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
      <div className="flex flex-col items-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="font-medium">{message}</span>
      </div>
    </TableCell>
  </tr>
);

Table.Row = TableRow;
Table.Cell = TableCell;
Table.EmptyRow = EmptyTableRow;

export default Table;
