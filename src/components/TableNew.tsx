import { ArrowRight, RefreshCw, Edit, Trash2 } from "lucide-react";
import Button from "./ui/Button";

interface TableColumn {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableNewProps {
  title?: string;
  subtitle?: string;
  columns: TableColumn[];
  data: any[];
  onRowAction?: (row: any) => void;
  onEditAction?: (row: any) => void;
  onDeleteAction?: (row: any) => void;
}

const TableNew = ({
  title = "Reservation List",
  subtitle = "An overview of all active reservations",
  columns,
  data,
  onRowAction,
  onEditAction,
  onDeleteAction,
}: TableNewProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md mt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>

        {/* Refresh Button */}
        <Button variant="default" icon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500">
              {columns.map((column) => (
                <th key={column.key} className="pb-2 pr-4">
                  {column.header}
                </th>
              ))}
              <th className="pb-2 w-40 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <td key={column.key} className="py-3 pr-4">
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
                <td className="py-3 w-40">
                  <div className="flex items-center justify-end gap-2">
                    {onEditAction && (
                      <Button
                        onClick={() => onEditAction(row)}
                        variant="default"
                        size="md"
                        icon={<Edit className="w-4 h-4" />}
                        title="Edit"
                      >
                        Edit
                      </Button>
                    )}
                    {onDeleteAction && (
                      <Button
                        onClick={() => onDeleteAction(row)}
                        variant="default"
                        size="md"
                        icon={<Trash2 className="w-4 h-4" />}
                        title="Delete"
                      >
                        Delete
                      </Button>
                    )}
                    {onRowAction && (
                      <button
                        onClick={() => onRowAction(row)}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                        title="View details"
                      >
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableNew;
