import { Tab } from '@headlessui/react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import Card from 'components/Card'
import Image from 'components/Image'
import QuestionHelper from 'components/QuestionHelper'
import { Feature } from 'enums'
import { Deposit, PairTools, Strategy, Withdraw } from 'features/lending'
import { useUnderworldPair } from 'features/underworld/hooks'
import { formatNumber, formatPercent } from 'functions/format'
import NetworkGuard from 'guards/Network'
import { useRedirectOnChainId } from 'hooks/useRedirectOnChainId'
import Layout from 'layouts/Underworld'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'
import { RecoilRoot } from 'recoil'

export default function Pair() {
  useRedirectOnChainId('/lend')

  const router = useRouter()
  const { i18n } = useLingui()

  const pair = useUnderworldPair(router.query.pair as string)

  if (!pair) return <div />

  return (
    <PairLayout>
      <Head>
        <title>Lend {pair.asset.tokenInfo.symbol} | Soul</title>
        <meta key="description" name="description" content={`Lend ${pair.asset.tokenInfo.symbol} on Kashi`} />
      </Head>
      <Card
        className="bg-dark-900"
        header={
          <Card.Header className="border-b-8 bg-dark-blue border-blue">
            <div className="flex items-center">
              <div className="flex items-center mr-4 space-x-2">
                {pair && (
                  <>
                    <Image
                      height={48}
                      width={48}
                      src={pair.asset.tokenInfo.logoURI}
                      className="w-10 h-10 rounded-lg sm:w-12 sm:h-12"
                      alt={pair.asset.tokenInfo.symbol}
                    />
                    <Image
                      height={48}
                      width={48}
                      src={pair.collateral.tokenInfo.logoURI}
                      className="w-10 h-10 rounded-lg sm:w-12 sm:h-12"
                      alt={pair.collateral.tokenInfo.symbol}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl text-high-emphesis">
                    {i18n._(t`Lend`)} {pair && pair.asset.tokenInfo.symbol}
                  </div>
                  <div className="flex items-center">
                    <div className="mr-1 text-sm text-secondary">{i18n._(t`Collateral`)}:</div>
                    <div className="mr-2 text-sm text-high-emphesis">{pair && pair.collateral.tokenInfo.symbol}</div>
                    <div className="mr-1 text-sm text-secondary">{i18n._(t`Oracle`)}:</div>
                    <div className="text-sm text-high-emphesis">{pair && pair.oracle.name}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card.Header>
        }
      >
        <div className="flex justify-between p-4 mb-8 xl:p-0">
          <div>
            <div className="text-lg text-secondary">Lent</div>
            <div className="text-2xl text-blue">
              {formatNumber(pair.currentUserAssetAmount.string)} {pair.asset.tokenInfo.symbol}
            </div>
            <div className="text-lg text-high-emphesis">{formatNumber(pair.currentUserAssetAmount.usd, true)}</div>
          </div>
          <div>
            <div className="text-lg text-secondary">{i18n._(t`Borrowed`)}</div>
            <div className="text-2xl text-high-emphesis">{formatPercent(pair.utilization.string)}</div>
          </div>
          <div className="text-right">
            <div>
              <div className="text-lg text-secondary">{i18n._(t`Supply APR`)}</div>
              <div className="text-2xl text-high-emphesis">{formatPercent(pair.supplyAPR.string)}</div>
            </div>
          </div>
        </div>

        <Tab.Group>
          <Tab.List className="flex p-1 rounded bg-dark-800">
            <Tab
              className={({ selected }) =>
                `${
                  selected ? 'bg-dark-900 text-high-emphesis' : ''
                } flex items-center justify-center flex-1 px-3 py-4 text-lg rounded cursor-pointer select-none text-secondary hover:text-primary focus:outline-none`
              }
            >
              {i18n._(t`Deposit`)} {pair.asset.tokenInfo.symbol}
            </Tab>
            <Tab
              className={({ selected }) =>
                `${
                  selected ? 'bg-dark-900 text-high-emphesis' : ''
                } flex items-center justify-center flex-1 px-3 py-4 text-lg rounded cursor-pointer select-none text-secondary hover:text-primary focus:outline-none`
              }
            >
              {i18n._(t`Withdraw`)} {pair.asset.tokenInfo.symbol}
            </Tab>
          </Tab.List>
          <Tab.Panel>
            <Deposit pair={pair} />
          </Tab.Panel>
          <Tab.Panel>
            <Withdraw pair={pair} />
          </Tab.Panel>
        </Tab.Group>
      </Card>
    </PairLayout>
  )
}

Pair.Provider = RecoilRoot

const PairLayout = ({ children }) => {
  const router = useRouter()
  const { i18n } = useLingui()
  const pair = useUnderworldPair(router.query.pair as string)

  return pair ? (
    <Layout
      left={
        <Card
          className="h-full bg-dark-900"
          backgroundImage="/bentobox/deposit.png"
          title={i18n._(t`Lend assets for interest from borrowers.`)}
          description={i18n._(
            t`Have assets you want to earn additional interest on? Lend them in isolated markets and earn interest from borrowers.`
          )}
        />
      }
      right={
        <Card className="h-full p-4 bg-dark-900 xl:p-0">
          <div className="flex-col space-y-2">
            <div className="flex justify-between">
              <div className="text-xl text-high-emphesis">{i18n._(t`Market`)}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-lg text-secondary">{i18n._(t`APR`)}</div>
              <div className="flex items-center">
                <div className="text-lg text-high-emphesis">{formatPercent(pair?.currentSupplyAPR.string)}</div>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="text-lg text-secondary">{i18n._(t`Total`)}</div>
              <div className="text-lg text-high-emphesis">
                {formatNumber(pair?.currentAllAssets.string)} {pair?.asset.tokenInfo.symbol}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="text-lg text-secondary">{i18n._(t`Available`)}</div>
              <div className="text-lg text-high-emphesis">
                {formatNumber(pair?.totalAssetAmount.string)} {pair?.asset.tokenInfo.symbol}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="text-lg text-secondary">{i18n._(t`Borrowed`)}</div>
              <div className="flex items-center">
                <div className="text-lg text-high-emphesis">{formatPercent(pair?.utilization.string)}</div>
              </div>
            </div>
            <div className="flex justify-between">
              <div className="text-lg text-secondary">{i18n._(t`Collateral`)}</div>
              <div className="flex items-center">
                <div className="text-lg text-high-emphesis">
                  {formatNumber(pair?.totalCollateralAmount.string)} {pair?.collateral.tokenInfo.symbol}
                </div>
              </div>
            </div>
            {pair?.utilization.value.gt(0) && (
              <div className="flex justify-between">
                <div className="text-lg text-secondary">{i18n._(t`Health`)}</div>
                <div className="flex items-center">
                  <div className="text-lg text-high-emphesis">{formatPercent(pair?.marketHealth.toFixed(16))}</div>
                </div>
              </div>
            )}

            <PairTools pair={pair} />

            <div className="flex justify-between pt-3">
              <div className="text-xl text-high-emphesis">{i18n._(t`Oracle`)}</div>
            </div>

            <div className="flex justify-between">
              <div className="text-lg text-secondary">Name</div>
              <div className="text-lg text-high-emphesis">{pair?.oracle.name}</div>
            </div>

            <div className="flex justify-between pt-3">
              <div className="text-xl text-high-emphesis">{i18n._(t`BentoBox`)}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-lg text-secondary">{i18n._(t`${pair?.asset.tokenInfo.symbol} Strategy`)}</div>
              <div className="flex flex-row text-lg text-high-emphesis">
                {pair.asset.strategy ? (
                  i18n._(t`Active`)
                ) : (
                  <>
                    {i18n._(t`None`)}
                    <QuestionHelper
                      text={i18n._(
                        t`BentoBox strategies can create yield for your liquidity while it is not lent out. This token does not yet have a strategy in the BentoBox.`
                      )}
                    />{' '}
                  </>
                )}
              </div>
            </div>

            <Strategy token={pair.asset} />
          </div>
        </Card>
      }
    >
      {children}
    </Layout>
  ) : null
}

//Pair.Layout = PairLayout

// Pair.Guard = NetworkGuard(Feature.KASHI)
