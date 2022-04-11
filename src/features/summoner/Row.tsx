import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { BigNumber, ethers } from 'ethers'
import { useSoulPrice } from 'hooks/getPrices'
import { useActiveWeb3React } from 'services/web3'
// import QuestionHelper from '../../components/QuestionHelper'
import { currencyEquals, NATIVE, SOUL, SOUL_ADDRESS, Token, WNATIVE } from 'sdk'
import AssetInput from 'components/AssetInput'
import { useRouterContract, useSoulSummonerContract, useSummonerAssistantContract, useSummonerContract } from 'hooks/useContract'
import useApprove from 'features/bond/hooks/useApprove'

import { FarmContentWrapper,
    FarmContainer, FarmItem, FarmItemBox, Text, FunctionBox, SubmitButton, Wrap
} from './Styles'
import { classNames, formatNumber, tryParseAmount } from 'functions'
import { usePairInfo, useSummonerPoolInfo, useSummonerUserInfo } from 'hooks/useAPI'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HeadlessUIModal from 'components/Modal/HeadlessUIModal'
// import Modal from 'components/DefaultModal'
import { ArrowLeftIcon, PlusIcon, XIcon } from '@heroicons/react/solid'
import { Button } from 'components/Button'
import Typography from 'components/Typography'
import Swap from 'pages/exchange/swap/[[...tokens]]'
import Modal from 'components/Modal/DefaultModal'
import ModalHeader from 'components/Modal/Header'
import HeaderNew from 'features/trade/HeaderNew'
import Add from 'pages/exchange/add/[[...tokens]]'
import HeaderAddModal from 'features/trade/HeaderAddModal'
import LiquidityHeader from 'features/liquidity/LiquidityHeader'
import { WFTM_ADDRESS } from 'constants/addresses'
import NavLink from 'components/NavLink'
import PoolAddLiquidity from 'features/mines/utils/PoolAddLiquidity'
import MineListItemDetails from 'features/mines/MineListItemDetails'
import HeadlessUiModal from 'components/Modal/HeadlessUIModal'
import { Field } from 'state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from 'state/mint/hooks'
import Web3Connect from 'components/Web3Connect'
import { ApprovalState, useApproveCallback } from 'hooks'
import PoolAddLiquidityReviewContent from 'features/mines/utils/PoolAddLiquidityReviewContent'
// import ManageSwapPair from './modals/ManageSwapPair'
// import { Deposit } from './modals/Deposit'

// const TokenPairLink = styled(ExternalLink)`
//   font-size: .9rem;
//   padding-left: 10;
// `

const HideOnSmall = styled.div`
@media screen and (max-width: 900px) {
  display: none;
}
`

const HideOnMobile = styled.div`
@media screen and (max-width: 600px) {
  display: none;
}
`

export const ActiveRow = ({ pid, farm, lpToken }) => {
    const { account, chainId } = useActiveWeb3React()
    const { erc20Allowance, erc20Approve, erc20BalanceOf } = useApprove(lpToken)
    const soulPrice = useSoulPrice()
    const [depositing, setDepositing] = useState(false)
    
    const [approved, setApproved] = useState(false)
    const [withdrawValue, setWithdrawValue] = useState('0')
    const [depositValue, setDepositValue] = useState('0')
    const [withdrawable, getWithdrawable] = useState('0')
    const [unstakedBal, setUnstakedBal] = useState(0)
    
    const SoulSummonerContract = useSoulSummonerContract()
    const SoulSummonerAddress = SoulSummonerContract.address
    const RouterContract = useRouterContract()

    //   const [confirmed, setConfirmed] = useState(false)
    //   const [receiving, setReceiving] = useState(0)
    const parsedDepositValue = tryParseAmount(depositValue, lpToken)
    const parsedWithdrawValue = tryParseAmount(withdrawValue, lpToken)
    // console.log('earnedAmount:%s', earnedAmount)
    // show confirmation view before minting SOUL
    // const [liquidity, setLiquidity] = useState(0)
    // const balance = useCurrencyBalance(account, lpToken)
    
    const { summonerPoolInfo } = useSummonerPoolInfo(pid)
    const liquidity = summonerPoolInfo.tvl
    const apr = summonerPoolInfo.apr
    const lpAddress = summonerPoolInfo.lpAddress
    
    const { pairInfo } = usePairInfo(lpAddress)
    const pairDecimals = pairInfo.pairDecimals

    const [showOptions, setShowOptions] = useState(false)
    const [openDeposit, setOpenDeposit] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [openWithdraw, setOpenWithdraw] = useState(false)
    const [openSwap, setOpenSwap] = useState(false)
    
    const { summonerUserInfo } = useSummonerUserInfo(pid)
    const stakedBalance = summonerUserInfo.stakedBalance
    const stakedValue = summonerUserInfo.stakedValue
    const earnedAmount = summonerUserInfo.pendingSoul
    const earnedValue = summonerUserInfo.pendingValue
    const parsedWithdrawAllValue = tryParseAmount(stakedBalance, lpToken)

    // ONLY USED FOR LOGO //
    const token0 = new Token(chainId, farm.token1Address[chainId], 18)
    const token1 = new Token(chainId, farm.token2Address[chainId], 18)
    // const pair = new Token(chainId, farm.lpToken.address, 18)
    // console.log('lpAddress:%s', lpAddress)
    
      // mint state
    const { independentField, typedValue, otherTypedValue } = useMintState()
    const { dependentField, currencies, parsedAmounts, noLiquidity, liquidityMinted, poolTokenPercentage, error } =
        useDerivedMintInfo(token0 ?? undefined, token1 ?? undefined)
    const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

    const isValid = !error

    // get formatted amounts
    const formattedAmounts = {
        [independentField]: typedValue,
        [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    }

    // check whether the user has approved the router on the tokens
    const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], RouterContract?.address)
    const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], RouterContract?.address)

    const [useETH, setUseETH] = useState(false)
    const oneCurrencyIsETH = token0?.isNative || token1?.isNative

    const oneCurrencyIsWETH = Boolean(
        chainId &&
          ((token0 && currencyEquals(token0, WNATIVE[chainId])) ||
            (token1 && currencyEquals(token1, WNATIVE[chainId])))
    )

    /**
     * Runs only on initial render/mount
     */
    useEffect(() => {
        fetchBals()
        fetchApproval()
    }, [account])

    /**
     * Runs on initial render/mount and reruns every 2 seconds
     */
    useEffect(() => {
        if (account) {
            const timer = setTimeout(() => {
                // if (showing) {
                    fetchBals()
                    fetchApproval()
                // }
            }, 3000)
            // Clear timeout if the component is unmounted
            return () => clearTimeout(timer)
        }
    })

    /**
     * Opens the function panel dropdowns.
     */
    const handleShowOptions = () => {
        setShowOptions(!showOptions)
        if (!showOptions) {
            fetchBals()
            fetchApproval()
        }
    }

    const handleShowDeposit = () => {
        setOpenDeposit(!openDeposit)
        if (!openDeposit) {
            fetchBals()
            fetchApproval()
        }
    }
   
    const handleShowWithdraw = () => {
        setOpenWithdraw(!openWithdraw)
    }

    const handleShowSwap = () => {
        setOpenSwap(!openSwap)
    }

    /**
     * Gets the lpToken balance of the user for each pool
     */
    const fetchBals = async () => {
        if (!account) {
            // alert('connect wallet')
        } else {
            try {
                // get total balance for pid from user balancess
                const result2 = await erc20BalanceOf(account)
                const unstaked = ethers.utils.formatUnits(result2)
                setUnstakedBal(Number(unstaked))

                return [unstaked]
            } catch (err) {
                // console.warn(err)
            }
        }
    }

    /**
     * Checks if the user has approved SoulSummonerAddress to move lpTokens
     */
    const fetchApproval = async () => {
        if (!account) {
            // alert('Connect Wallet')
        } else {
            // Checks if SoulSummonerContract can move tokens
            const amount = await erc20Allowance(account, SoulSummonerAddress)
            if (amount > 0) setApproved(true)
            return amount
        }
    }

    /**
     * Approves SoulSummonerAddress to move lpTokens
     */
    const handleApprove = async () => {
        if (!account) {
            // alert('Connect Wallet')
        } else {
            try {
                const tx = await erc20Approve(SoulSummonerAddress)
                await tx?.wait().then(await fetchApproval())
            } catch (e) {
                // alert(e.message)
                console.log(e)
                return
            }
        }
    }

    // // /**
    // //  * Withdraw Shares
    // //  */
    const handleWithdraw = async (pid, parsedWithdrawValue) => {
        try {
            const tx = await SoulSummonerContract?.withdraw(pid, parsedWithdrawValue?.quotient.toString())
            // await tx?.wait().then(await setPending(pid))
            await tx?.wait()
        } catch (e) {
            // alert(e.message)
            console.log(e)
        }
    }

    // const handleWithdrawAll = async (pid, parsedWithdrawAllValue) => {
    //     try {
    //         const tx = await SoulSummonerContract?.withdraw(pid, parsedWithdrawAllValue?.quotient.toString())
    //         // await tx?.wait().then(await setPending(pid))
    //         await tx?.wait()
    //     } catch (e) {
    //         // alert(e.message)
    //         console.log(e)
    //     }
    // }

    // // /**
    // //  * Harvest Shares
    // //  */
    const handleHarvest = async (pid) => {
        try {
            let tx
            tx = await SoulSummonerContract?.deposit(pid, 0)
            await tx?.wait() // .then(await fetchEarnings())
        } catch (e) {
            // alert(e.message)
            console.log(e)
        }
    }

    // /**
    //  * Deposits Soul
    //  */
    const handleDeposit = async (amount) => {
        try {
            const tx = await SoulSummonerContract?.deposit(account, parsedDepositValue?.quotient.toString())
            await tx.wait()
            await fetchBals()
        } catch (e) {
            // alert(e.message)
            console.log(e)
        }
    }

    return (
        <>
            <div className="flex justify-center w-full">
                <FarmContainer>
                    <div className="bg-dark-1200 p-3 border border-dark-1000 hover:border-dark-600" onClick={() => handleShowOptions()}>
                        <FarmContentWrapper>
                            <div className="items-center">
                                <FarmItemBox>
                                    <DoubleCurrencyLogo currency0={token0} currency1={token1} size={40} />
                                </FarmItemBox>
                            </div>

                        {/* <HideOnMobile>
                            <FarmItemBox>
                                <FarmItem>
                                    {Number(apr).toString() === '0.00' ? (
                                        <Text padding="0" fontSize="1rem" color="#666">
                                            0
                                        </Text>
                                    ) : (
                                        <Text padding="0" fontSize="1rem" color="#FFFFFF">
                                        {Number(stakedBalance) == 0 ? '0' 
                                            : Number(stakedBalance).toFixed(0).toString() == '0' ? Number(stakedBalance).toFixed(6)
                                                : Number(stakedBalance)
                                                    .toFixed(0)
                                                    .toString()
                                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                        }
                                        </Text>
                                    )}
                                </FarmItem>
                            </FarmItemBox>
                        </HideOnMobile> */}

                    {/* STAKED VALUE */}
                        <HideOnMobile>
                            <FarmItemBox>
                                <FarmItem>
                                    {Number(apr).toString() === '0.00' ? (
                                        <Text padding="0" fontSize="1rem" color="#666">
                                            0
                                        </Text>
                                    ) : (
                                        <Text padding="0" fontSize="1rem" color="#FFFFFF">
                                        ${Number(stakedValue) == 0 ? '0' 
                                            : Number(stakedValue).toString(4) == '0.0000' ? '<0.0000'
                                            : Number(stakedValue) < 1 && Number(stakedValue).toString(4)
                                        ? Number(stakedValue).toFixed(4)
                                            : Number(stakedValue) > 0
                                                ? Number(stakedValue).toFixed(0)
                                                .toString()
                                                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                    : 0
                                        }
                                        </Text>
                                    )}
                                </FarmItem>
                            </FarmItemBox>
                        </HideOnMobile>

                    {/* STAKED OWNERSHIP */}
                        <HideOnSmall>
                            <FarmItemBox>
                                <FarmItem>
                                    {Number(stakedValue).toFixed(0).toString() === '0' ? (
                                        <Text padding="0" fontSize="1rem" color="#666">
                                            0%
                                        </Text>
                                    ) : (
                                        <Text padding="0" fontSize="1rem" color="#FFFFFF">
                                        { (Number(stakedValue) / Number(liquidity) * 100).toFixed(0) }%
                                        </Text>
                                    )}
                                </FarmItem>
                            </FarmItemBox>
                        </HideOnSmall>

                    {/* % APR */}
                            <FarmItemBox>
                                <FarmItem>
                                    {Number(apr).toString() === '0.00' ? (
                                        <Text padding="0" fontSize="1rem" color="#666">
                                            0
                                        </Text>
                                    ) : (
                                        <Text padding="0" fontSize="1rem" color="#FFFFFF">
                                            {Number(apr).toFixed()}%
                                        </Text>
                                    )}
                                </FarmItem>
                            </FarmItemBox>

                            <FarmItemBox className="flex">
                                {Number(earnedValue).toFixed(0).toString() === '0' ? (
                                    <Text padding="0" fontSize="1rem" color="#666">
                                        0
                                    </Text>
                                ) : (
                                    <Text padding="0" fontSize="1rem" color="#F36FFE">
                                        ${Number(earnedValue).toFixed(0)}
                                    </Text>
                                )}
                            </FarmItemBox>
                            <FarmItemBox className="flex" >
                                {Number(liquidity) === 0 ? (
                                    <Text padding="0" fontSize="1rem" color="#666">
                                        $0
                                    </Text>
                                ) : (
                                    <Text padding="0" fontSize="1rem">
                                        ${Number(liquidity)
                                            .toFixed(0)
                                            .toString()
                                            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}{' '}
                                    </Text>
                                )}

                            </FarmItemBox>

                        </FarmContentWrapper>
                    </div>
                </FarmContainer>
            </div>

        {showOptions && (
            // <Wrap padding="0" display="flex" justifyContent="center">
                <div className="flex justify-center p-4 w-full mt-2 mb-2 border border-dark-1000 hover:border-dark-600">
                <HeadlessUIModal.BorderedContent className="bg-dark-1200 w-full">
                    {/* <div className="relative text-lg text-center font-bold mb-4">
                    { ' ' }
                    <br />
                        <Button
                            // type="button"
                            onClick={() => setShowOptions(false)}
                            className="absolute top-0 right-0 opacity-80 hover:opacity-100 
                            focused:opacity-100 rounded p-1 text-primary hover:text-high-emphesis 
                            focus:text-high-emphesis focus:outline-none focus:ring focus:ring-offset 
                            focus:ring-offset-purple focus:ring-purple"
                        >
                            <XIcon className="w-5 h-5" aria-hidden="true" />
                        </Button>
                    </div> */}

                    {/* USER: NOT STAKED & NO BALANCE */}
                    
                        {/* <FunctionBox>
                        <Wrap padding="0" margin="0" display="flex">         
                         */}

                    {/* HOLDS 0 LP TOKENS */}
                    {Number(unstakedBal) == 0 && (
                        <FunctionBox>
                        <Wrap padding="0" margin="0" display="flex">
                            <SubmitButton
                                height="2rem"
                                primaryColour="#B485FF"
                                color="black"
                                margin=".5rem 0 .5rem 0"
                                onClick={() => setOpenSwap(true)}
                            >
                                ADD {farm.lpSymbol}
                                {/* <NavLink
                                    href=
                                    {`/swap/add`}
                                >
                                    <a> 
                                        ADD LIQUIDITY   
                                    </a>
                                </NavLink> */}
                            </SubmitButton>
                            </Wrap>
                        </FunctionBox>
                    )}

                    {/* UN-APPROVED */}
                    {!approved &&  (
                        <FunctionBox>
                            <Wrap padding="0" margin="0" display="flex">
                                <SubmitButton 
                                    height="2rem"
                                    primaryColour="#B485FF"
                                    color="black"
                                    margin=".5rem 0 .5rem 0"
                                    onClick={() => handleApprove()}>
                                    APPROVE {farm.lpSymbol}
                                </SubmitButton>
                            </Wrap>
                        </FunctionBox>
                    )}

                    {/* FARMER WITH APPROVAL */}  
                        {approved && Number(stakedBalance) > 0 && (
                            <FunctionBox>
                                <Wrap padding="0" margin="0" display="flex">
                                    <SubmitButton
                                        height="2rem"
                                        primaryColour="#B485FF"
                                        color="black"
                                        margin=".5rem 0 .5rem 0"
                                        onClick={() =>
                                            setOpenDeposit(true)
                                            
                                        }
                                    >
                                        DEPOSIT { farm.lpSymbol }
                                    </SubmitButton>
                                </Wrap>
                                <FunctionBox>

                            <Wrap padding="0" margin="0" display="flex">
                                <SubmitButton
                                height="2rem"
                                primaryColour="#B485FF"
                                color="black"
                                margin=".5rem 0 .5rem 0"
                                onClick={() =>
                                    setOpenWithdraw(true)
                                }
                                >
                                    WITHDRAW { farm.lpSymbol }
                                </SubmitButton>
                            </Wrap>
                        </FunctionBox>

                            <Wrap padding="0" margin="0" display="flex">
                                <SubmitButton
                                    height="2rem"
                                    primaryColour="#B485FF"
                                    color="black"
                                    margin=".5rem 0 .5rem 0"
                                    onClick={() =>
                                        setShowConfirmation(true)
                                    }
                                >
                                    WITHDRAW ALL
                                </SubmitButton>
                            </Wrap>
                            <Wrap padding="0" margin="0" display="flex">
                                    <SubmitButton
                                        height="2rem"
                                        primaryColour="#B485FF"
                                        color="black"
                                        margin=".5rem 0 .5rem 0"
                                        onClick={() =>
                                            handleHarvest(pid)
                                        }
                                    >
                                        HARVEST {Number(earnedAmount).toFixed(0)} SOUL
                                    </SubmitButton>
                            </Wrap>
                            </FunctionBox>
                            )}
                </HeadlessUIModal.BorderedContent>
            </div>
        )}

{/* DEPOSIT MODAL */}
{openDeposit && (
    // <Wrap padding="0" display="flex" justifyContent="center">
        <HeadlessUIModal.BorderedContent
            // isOpen={openDeposit} 
            // onDismiss={ () => setOpenDeposit(false) }
        >
                    <div className="relative justify-right">
                        <Button
                            // type="button"
                            onClick={() => handleShowDeposit()}
                            className="inline-flex opacity-80 hover:opacity-100 focused:opacity-100 rounded p-1.5 text-primary hover:text-high-emphesis focus:text-high-emphesis focus:outline-none focus:ring focus:ring-offset focus:ring-offset-purple focus:ring-purple"
                        >
                            <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
                        </Button>
                    </div>
                        <FunctionBox>
                            <div className="flex flex-col bg-dark-1000 p-3 border border-1 border-dark-1000 hover:border-dark-600 w-full space-y-1">
                            <div className="text-xl text-center font-bold mb-3 text-dark-600">
                                Deposit { farm.lpSymbol }
                            </div>
                            <div className="flex justify-between">
                                <Typography className="text-white" fontFamily={'medium'}>
                                    Deposited Amount
                                </Typography>
                                <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
                                    {Number(stakedBalance).toFixed(2)} LP
                                </Typography>
                            </div>
                            <div className="flex justify-between">
                                <Typography className="text-white" fontFamily={'medium'}>
                                    Pending Rewards
                                </Typography>
                                <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
                                    {Number(earnedAmount).toFixed(2)} SOUL
                                </Typography>
                            </div>
                            <div className="h-px my-6 bg-dark-1000" />
                        <div className="flex flex-col bg-dark-1000 mb-2 p-3 border border-green border-1 hover:border-dark-600 w-full space-y-1">
                            <div className="text-white">
                                <div className="block text-md md:text-xl text-white text-center font-bold p-1 -m-3 text-md transition duration-150 ease-in-out rounded-md hover:bg-dark-300">
                                    <span> {formatNumber(Number(apr), false, true)}% APR</span>
                                </div>
                            </div>
                        </div>
                    </div>
                        <Wrap padding="0" margin="0" display="flex">
                            <SubmitButton
                                height="2rem"
                                primaryColour="#B485FF"
                                color="black"
                                margin=".5rem 0 .5rem 0"
                                onClick={() =>
                                    handleDeposit(depositValue)
                                }
                            >
                                DEPOSIT SOUL
                            </SubmitButton>
                        </Wrap>
                    <Wrap padding="0" margin="0" display="flex">
                            <SubmitButton
                                height="2rem"
                                primaryColour="#bbb"
                                color="black"
                                margin=".5rem 0 .5rem 0"
                                onClick={() =>
                                    handleHarvest(pid)
                                }
                            >
                                HARVEST {Number(earnedAmount).toFixed(0)} SOUL
                                {/* {Number(earnedAmount) !== 0 ? `($${(Number(earnedAmount) * soulPrice).toFixed(0)})` : ''} */}
                            </SubmitButton>
                    </Wrap>
                    
                    </FunctionBox>
                
                   </HeadlessUIModal.BorderedContent>
                // </Wrap>
)}

{/* WITHDRAW MODAL */}
{openWithdraw && (
        <HeadlessUIModal.BorderedContent>
                    <div className="relative justify-right">
                        <Button
                            onClick={() => handleShowWithdraw()}
                            className="inline-flex opacity-80 hover:opacity-100 focused:opacity-100 rounded p-1.5 text-primary hover:text-high-emphesis focus:text-high-emphesis focus:outline-none focus:ring focus:ring-offset focus:ring-offset-purple focus:ring-purple"
                        >
                            <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
                        </Button>
                    </div>
                        <FunctionBox>
                            <div className="flex flex-col bg-dark-1000 p-3 border border-1 border-dark-1000 hover:border-dark-600 w-full space-y-1">
                            <div className="text-xl text-center font-bold mb-3 text-dark-600">
                                Withdraw { farm.lpSymbol }
                            </div>
                            <div className="flex justify-between">
                                <Typography className="text-white" fontFamily={'medium'}>
                                    Deposited Amount
                                </Typography>
                                <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
                                    {Number(stakedBalance).toFixed(2)} LP
                                </Typography>
                            </div>
                            {/* TODO: WITHDRAWABLE AMOUNT */}
                            <div className="flex justify-between">
                                <Typography className="text-white" fontFamily={'medium'}>
                                    Withdrawable Amount
                                </Typography>
                                <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
                                    {Number(0).toFixed(2)} LP
                                </Typography>
                            </div>
                            <div className="flex justify-between">
                                <Typography className="text-white" fontFamily={'medium'}>
                                    Pending Rewards
                                </Typography>
                                <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
                                    {Number(earnedAmount).toFixed(2)} SOUL
                                </Typography>
                            </div>
                            <div className="h-px my-6 bg-dark-1000" />
                        <div className="flex flex-col bg-dark-1000 mb-2 p-3 border border-green border-1 hover:border-dark-600 w-full space-y-1">
                            <div className="text-white">
                                <div className="block text-md md:text-xl text-white text-center font-bold p-1 -m-3 text-md transition duration-150 ease-in-out rounded-md hover:bg-dark-300">
                                    <span> {formatNumber(Number(0), false, true)}% FEE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                        <Wrap padding="0" margin="0" display="flex">
                            <SubmitButton
                                height="2rem"
                                primaryColour="#B485FF"
                                color="black"
                                margin=".5rem 0 .5rem 0"
                                onClick={() =>
                                    handleDeposit(depositValue)
                                }
                            >
                                DEPOSIT SOUL
                            </SubmitButton>
                        </Wrap>
                    <Wrap padding="0" margin="0" display="flex">
                            <SubmitButton
                                height="2rem"
                                primaryColour="#bbb"
                                color="black"
                                margin=".5rem 0 .5rem 0"
                                onClick={() =>
                                    handleHarvest(pid)
                                }
                            >
                                HARVEST {Number(earnedAmount).toFixed(0)} SOUL
                                {/* {Number(earnedAmount) !== 0 ? `($${(Number(earnedAmount) * soulPrice).toFixed(0)})` : ''} */}
                            </SubmitButton>
                    </Wrap>
                    
                    </FunctionBox>
                </HeadlessUIModal.BorderedContent>
)}
      {openSwap && (
        <HeadlessUIModal.BorderedContent
            // isOpen={openSwap} onDismiss={() => setOpenSwap(false)}
        >

        {/* <PoolAddLiquidity currencyA={token0} currencyB={token1} header={''}/> */}

        <HeadlessUiModal.BorderedContent className="flex flex-col gap-4 bg-dark-1000/40">
        {''}
        <AssetInput
          size="sm"
          id="add-liquidity-input-tokena"
          value={formattedAmounts[Field.CURRENCY_A]}
          currency={token0}
          onChange={onFieldAInput}
          showMax={false}
        />
        <div className="z-10 flex justify-center -mt-6 -mb-6">
          <div className="p-1.5 rounded-full bg-dark-800 border border-dark-800 shadow-md border-dark-700">
            <PlusIcon width={14} className="text-high-emphesis" />
          </div>
        </div>
        <AssetInput
          size="sm"
          id="add-liquidity-input-tokena"
          value={formattedAmounts[Field.CURRENCY_B]}
          currency={token1}
          onChange={onFieldBInput}
          className="!mt-0"
          showMax={false}
        />
        {(oneCurrencyIsETH || oneCurrencyIsWETH) && (
        /* {(oneCurrencyIsETH || oneCurrencyIsWETH) && chainId != ChainId.CELO && ( */
            <div className="flex justify-center">
            <Button size="xs" variant="filled" color="purple" className="rounded-none" onClick={() => 
              setUseETH(!useETH)
            }
              >
              {`Use`} {useETH && 'W'}
              {NATIVE[chainId].symbol} instead of {!useETH && 'W'}
              {NATIVE[chainId].symbol}
            </Button>
          </div>
        )}
      </HeadlessUiModal.BorderedContent>
      {!account ? (
        <Web3Connect />
        // <Web3Connect fullWidth />
      ) : isValid &&
        (approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) ? (
        <div className="flex gap-4">
          {approvalA !== ApprovalState.APPROVED && (
            <Button
              fullWidth
              loading={approvalA === ApprovalState.PENDING}
              onClick={approveACallback}
              disabled={approvalA === ApprovalState.PENDING}
              style={{
                width: approvalB !== ApprovalState.APPROVED ? '48%' : '100%',
              }}
            >
              {`Approve ${currencies[Field.CURRENCY_A]?.symbol}`}
            </Button>
          )}
          {approvalB !== ApprovalState.APPROVED && (
            <Button
              fullWidth
              loading={approvalB === ApprovalState.PENDING}
              onClick={approveBCallback}
              disabled={approvalB === ApprovalState.PENDING}
            >
              {`Approve ${currencies[Field.CURRENCY_B]?.symbol}`}
            </Button>
          )}
        </div>
      ) : ( null
        // <Button
        //   color={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B] ? 'red' : 'blue'}
        //   onClick={() => {
        //     isExpertMode
        //       ? onAdd()
        //       : setContent(
        //           <PoolAddLiquidityReviewContent
        //             noLiquidity={noLiquidity}
        //             liquidityMinted={minLiquidityCurrencyAmount}
        //             poolShare={poolTokenPercentage}
        //             parsedAmounts={parsedAmounts}
        //             execute={onAdd}
        //           />
        //         )
        //   }}
        //   disabled={!isValid || attemptingTxn}
        //   fullWidth
        // >
        //   {error ?? `Confirm Adding Liquidity`}
        // </Button>
      )}
      </HeadlessUIModal.BorderedContent>
      )}
{/* {openSwap && (
    <HeadlessUIModal.BorderedContent>
    // isOpen={true} onDismiss={() => setOpenSwap(false)}>
        <div className="relative justify-right">
                        <Button
                            // type="button"
                            onClick={() => handleShowSwap()}
                            className="inline-flex opacity-80 hover:opacity-100 focused:opacity-100 rounded p-1.5 text-primary hover:text-high-emphesis focus:text-high-emphesis focus:outline-none focus:ring focus:ring-offset focus:ring-offset-purple focus:ring-purple"
                        >
                            <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
                        </Button>
        </div>
        
        <Add />
    
    </HeadlessUIModal.BorderedContent>
)} */}

{ showConfirmation && (
<Modal isOpen={showConfirmation} onDismiss={
        () => setShowConfirmation(false)}>
        <div className="space-y-4">
          <ModalHeader header={`Are you sure?`} onClose={() => setShowConfirmation(false)} />
          <Typography variant="lg">
            Withdrawing prior to a <b>14-Day Period</b> starts with a fee of 14% and 0% (after 14 days) have elapsed
            (<b>aka 1% less each day</b>).
            <br /><br />
            <b>100% of the fee</b> goes towards building our protocol-owned liquidity, which brings about long-term sustainability to our platform.
          </Typography>
          <Typography variant="sm" className="font-medium">
            QUESTIONS OR CONCERNS?
            <a href="mailto:soulswapfinance@gmail.com">
              {' '} CONTACT US
            </a>
          </Typography>
          <Button
            height="2.5rem"
            color="purple"
            // onClick={() => handleDeposit(ethers.utils.parseUnits(document.getElementById('stake').value))}
            onClick={() =>
                handleWithdraw(pid, parsedWithdrawValue?.quotient.toString())
            }
          >
            I UNDERSTAND THESE TERMS
          </Button>
          {/* <Button
            color="red"
            size="lg"
            onClick={() => {
              if (window.prompt(`Please type the word "confirm" to enable expert mode.`) === 'confirm') {
                setShowConfirmation(false)
              }
              setShowConfirmation(false)
            }}
          >
            <Typography variant="lg" id="confirm-expert-mode">
              { `I UNDERSTAND THESE TERMS` }
            </Typography> */}

          {/* </Button> */}
        </div>
      </Modal>
    )}
</>
)}