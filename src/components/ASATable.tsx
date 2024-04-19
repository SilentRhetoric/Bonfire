import {
  getCoreRowModel,
  createSolidTable,
  flexRender,
  getSortedRowModel,
  RowData,
  CellContext,
} from "@tanstack/solid-table"
import { AssetData, UseNetwork } from "solid-algo-wallets"
import { Component, For, createEffect, createMemo, createSignal } from "solid-js"
import { BonfireAssetData } from "../lib/types"
import useBonfire from "../lib/useBonfire"
// import { ASAImage } from "./ASAImage"

declare module "@tanstack/solid-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string | keyof AssetData, value: unknown) => void
  }
}

const IndeterminateCheckbox: Component<{
  indeterminate: boolean
  checked: boolean
}> = (props) => {
  let ref: HTMLInputElement

  createEffect(() => {
    if (typeof props.indeterminate === "boolean") {
      ref.indeterminate = !props.checked && props.indeterminate
    }
  })

  return (
    <input
      type="checkbox"
      ref={(el) => (ref = el)}
      class={"checkbox"}
      name="Select asset"
      aria-label="Select asset"
      {...props}
    />
  )
}

export const ASATable: Component = () => {
  const {
    // burnableAsas,
    accountAssets,
    setAccountAssets,
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
  } = useBonfire

  const { getAsaUrl } = UseNetwork

  // createComputed(() =>
  //   console.debug("accountAsssets in component: ", JSON.stringify(accountAssets)),
  // )
  // createComputed(() => console.debug("burnableASAs: ", JSON.stringify(burnableAsas())))
  // createComputed(() => console.debug("rowSelection: ", JSON.stringify(rowSelection())))

  const columns = [
    {
      id: "select",
      // Disabling this select all shortcut to avoid unintentional selection of assets
      // header: (data: {
      //   table: {
      //     getIsAllRowsSelected: () => boolean
      //     getIsSomeRowsSelected: () => boolean
      //     getToggleAllRowsSelectedHandler: () => unknown
      //   }
      // }) => (
      //   <IndeterminateCheckbox
      //     {...{
      //       checked: data.table.getIsAllRowsSelected(),
      //       indeterminate: data.table.getIsSomeRowsSelected(),
      //       onChange: data.table.getToggleAllRowsSelectedHandler(),
      //     }}
      //   />
      // ),
      cell: (data: {
        row: {
          original: BonfireAssetData
          getIsSelected: () => boolean
          getCanSelect: () => boolean
          getIsSomeSelected: () => boolean
          getToggleSelectedHandler: () => unknown
        }
      }) => (
        <IndeterminateCheckbox
          {...{
            checked: data.row.getIsSelected(),
            disabled: !data.row.getCanSelect() || data.row.original.frozen === true,
            indeterminate: data.row.getIsSomeSelected(),
            onChange: data.row.getToggleSelectedHandler(),
          }}
        />
      ),
    },
    {
      accessorKey: "decimalAmount",
      header: "Amount",
      cell: (c: CellContext<BonfireAssetData, unknown>) => {
        // eslint-disable-next-line solid/reactivity
        const initialValue = c.getValue() as number
        // We need to keep and update the state of the cell normally
        const [value, setValue] = createSignal<number>(initialValue)
        // createComputed(() => console.debug("value: ", value()))

        // When the input is blurred, we'll call our table meta's updateData function
        // if the input value is different from the original decimalAmount value
        const onBlur = () => {
          if (value() == c.row.original.decimalAmount) {
            // console.debug("original.decimalAmount: ", c.row.original.decimalAmount)
            // console.debug("Not updating data: ", value())
            return
          } else if (0 < value() && value() < c.row.original.decimalAmount) {
            // console.debug("original.decimalAmount: ", c.row.original.decimalAmount)
            // console.debug("Updating data 1: ", value())
            c.table.options.meta?.updateData(c.row.index, c.column.id, value())
            // console.debug("row: ", c.row)
          } else {
            // console.debug("original.decimalAmount: ", c.row.original.decimalAmount)
            // console.debug("Updating data 2: ", c.row.original.decimalAmount)
            c.table.options.meta?.updateData(c.row.index, c.column.id, c.row.original.decimalAmount)
            setValue(c.row.original.decimalAmount)
          }
        }

        const onChange = (
          e: Event & {
            currentTarget: HTMLInputElement
            target: HTMLInputElement
          },
        ) => {
          // console.debug("e.target.value: ", e.target.value)
          setValue(Number(e.target.value))
        }

        // If the initialValue is changed externally, sync it up with our state
        createEffect(() => {
          // console.debug("initialValue: ", initialValue)
          setValue(initialValue)
        })

        const disabled = c.row.original.frozen === true

        return (
          <input
            value={value()}
            onChange={onChange}
            onBlur={onBlur}
            class="input input-xs w-28 text-right text-sm"
            type="number"
            max={c.row.original.decimalAmount}
            min={0}
            name="Asset amount"
            aria-label="Asset amount"
            disabled={disabled}
          />
        )
      },
    },
    // {
    //   id: "image",
    //   accessorKey: "imageSrc",
    //   header: (
    //     <svg
    //       xmlns="http://www.w3.org/2000/svg"
    //       fill="none"
    //       viewBox="0 0 24 24"
    //       stroke-width="1.5"
    //       stroke="currentColor"
    //       class="h-6 w-6"
    //     >
    //       <path
    //         stroke-linecap="round"
    //         stroke-linejoin="round"
    //         d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
    //       />
    //     </svg>
    //   ),
    //   cell: (c: CellContext<BonfireAssetData, unknown>) => {
    //     return <ASAImage asset={c.row.original} />
    //   },
    // },
    {
      accessorKey: "name",
      header: "Name",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      accessorKey: "unitName",
      header: "Unit",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: (info: { getValue: () => number }) => {
        return (
          <a
            href={getAsaUrl(info.getValue())}
            target="_blank"
            aria-label="View asset on Allo"
          >
            {info.getValue()}
          </a>
        )
      },
    },
  ]

  const table = createMemo(() => {
    return createSolidTable({
      debugTable: true,
      data: accountAssets,
      // @ts-expect-error Complains that the SVG isn't a valid header for the image column
      columns,
      getCoreRowModel: getCoreRowModel(),
      enableRowSelection: true,
      enableMultiRowSelection: true,
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
      state: {
        get sorting() {
          return sorting()
        },
        get rowSelection() {
          return rowSelection()
        },
      },
      onRowSelectionChange: setRowSelection,
      // Provide our updateData function to our table meta
      meta: {
        updateData: (rowIndex, columnId: string | keyof AssetData, value: unknown) => {
          // console.debug(`Updating row ${rowIndex} column ${columnId} value ${value}`)
          setAccountAssets(
            // This method updates the store but changing one element isn't reactive
            // https://www.solidjs.com/docs/latest/api#arrays-in-stores
            // rowIndex,
            // columnId as keyof BonfireAssetData,
            // value,
            // This method replaces the whole array which makes it reactive
            (prev) => {
              // console.debug("prev: ", prev)
              let modifiedArray = []
              modifiedArray = prev.map((row, index) => {
                // console.debug("row: ", row)
                if (index === rowIndex) {
                  return {
                    ...prev[rowIndex]!,
                    [columnId]: value,
                  }
                }
                return row
              })
              // console.debug("modifiedArray: ", modifiedArray)
              return modifiedArray
            },
          )
        },
      },
    })
  })

  return (
    <div class="max-h-[400px] max-w-[100vw] overflow-auto">
      <table class="table table-pin-rows table-xs">
        <thead class="text-base text-base-content">
          <For each={table().getHeaderGroups()}>
            {(headerGroup) => (
              <tr class="bg-base-200">
                <For each={headerGroup.headers}>
                  {(header) => (
                    <th onClick={header.column.getToggleSortingHandler()}>
                      <div class="hover flex items-center justify-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}{" "}
                        {{
                          asc: (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              class="h-4 w-4"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M10 18a.75.75 0 01-.75-.75V4.66L7.3 6.76a.75.75 0 11-1.1-1.02l3.25-3.5a.75.75 0 011.1 0l3.25 3.5a.75.75 0 01-1.1 1.02l-1.95-2.1v12.59A.75.75 0 0110 18z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          ),
                          desc: (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              class="h-4 w-4"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M10 2a.75.75 0 01.75.75v12.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          ),
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  )}
                </For>
              </tr>
            )}
          </For>
        </thead>
        <tbody>
          <For each={table().getRowModel().rows}>
            {(row) => (
              <tr class="hover">
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
