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
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th 
                key={index}
                className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
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
  className = "px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-900",
  colSpan 
}) => (
  <td className={className} colSpan={colSpan}>
    {children}
  </td>
);

const EmptyTableRow = ({ message, colSpan }) => (
  <tr>
    <TableCell colSpan={colSpan} className="px-2 sm:px-4 lg:px-6 py-4 text-center text-xs sm:text-sm text-gray-500">
      {message}
    </TableCell>
  </tr>
);

Table.Row = TableRow;
Table.Cell = TableCell;
Table.EmptyRow = EmptyTableRow;

export default Table;
