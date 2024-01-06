import { Component, Match, Switch, createResource } from "solid-js"
import { BonfireAssetData } from "../lib/types"
import { CoinIcon } from "./Icons"
import { Image } from "@kobalte/core"
import useAsaIcons from "../lib/useAsaIcons"
import { ipfsFromAsset } from "../lib/utilities"

export const ASAImage: Component<{ asset: BonfireAssetData }> = (props) => {
  const [ipfsUrl] = createResource(() => props.asset, ipfsFromAsset)
  const { asaList } = useAsaIcons

  return (
    // <Suspense fallback={<CoinIcon />}>
    <Switch
      fallback={
        <Image.Root
          // fallbackDelay={20}
          class="h-6 w-6"
        >
          <Image.Img
            src={ipfsUrl()}
            alt="Image"
            class="h-6 w-6"
          />
          <Image.Fallback>
            <CoinIcon />
          </Image.Fallback>
        </Image.Root>
      }
    >
      <Match when={asaList.state == "ready" && asaList()[props.asset?.id]?.logo?.png}>
        <Image.Root
          // fallbackDelay={20}
          class="h-6 w-6"
        >
          <Image.Img
            src={asaList.latest && asaList()[props.asset.id]?.logo?.png}
            alt="Icon"
            class="h-6 w-6"
          />
          <Image.Fallback>
            <CoinIcon />
          </Image.Fallback>
        </Image.Root>
      </Match>
    </Switch>
    // </Suspense>
  )
}
