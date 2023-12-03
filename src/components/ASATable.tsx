import { getCoreRowModel, ColumnDef, createSolidTable, flexRender } from "@tanstack/solid-table"
import { AssetData } from "solid-algo-wallets"
import { Accessor, Component, For } from "solid-js"

export const ASATable: Component<{ assets: Accessor<AssetData[]> }> = (props) => {
  const tableColumns: ColumnDef<AssetData>[] = [
    { accessorKey: "amount", cell: (info) => info.getValue(), footer: (props) => props.column.id },
    { accessorKey: "id", cell: (info) => info.getValue(), footer: (props) => props.column.id },
    { accessorKey: "name", cell: (info) => info.getValue(), footer: (props) => props.column.id },
    {
      accessorKey: "unitName",
      cell: (info) => info.getValue(),
      footer: (props) => props.column.id,
    },
    {
      accessorKey: "frozen",
      cell: (info) => info.getValue().toString(),
      footer: (props) => props.column.id,
    },
  ]

  const table = createSolidTable({
    get data() {
      return props.assets()
    },
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
  })

  return (
    <div class="overflow-x-auto">
      <table class="table table-pin-rows">
        <thead class="text text-lg text-base-content">
          <For each={table.getHeaderGroups()}>
            {(headerGroup) => (
              <tr>
                <th class="text-center">🔥</th>
                <For each={headerGroup.headers}>
                  {(header) => (
                    <th>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  )}
                </For>
              </tr>
            )}
          </For>
        </thead>
        <tbody>
          <For each={table.getRowModel().rows}>
            {(row) => (
              <tr class="hover">
                <th>
                  <label>
                    <input
                      type="checkbox"
                      class="checkbox"
                    />
                  </label>
                </th>
                <For each={row.getVisibleCells()}>
                  {(cell) => <td>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}
