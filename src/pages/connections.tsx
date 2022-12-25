import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/router'
import type { NextPage } from 'next'
import { useEffect, useState, useMemo, Fragment } from 'react';
import { AdjustmentsHorizontalIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { Address, Identity } from '../utils/constants';
import { formatAddress } from '../utils/format';
import { EXMHandleNetworks } from '../utils/exm';

const Connections: NextPage = () => {
  const router = useRouter()

  const [loading, setLoading] = useState<boolean | null>(null);
  const [response, setResponse] = useState<any>();
  const [identity, setIdentity]= useState<any>([]);
  const [arweaveIdentity, setArweaveIdentity] = useState<Address | undefined>();
  const [convertedNetworks, setConvertedNetworks] = useState<any>();
  const [filterNetwork, setFilterNetwork] = useState<string>("");  
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [addresses, setAddresses] = useState<any>();

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      const res = await axios.get('api/exmread');
      const data = res.data;
      setResponse(data)
      const converted = EXMHandleNetworks(['ARWEAVE-MAINNET', ...data.evm_networks, ...data.exotic_networks])
      setConvertedNetworks(converted)
    }
    fetchData()
    .then(() => setLoading(false));
  }, [])

  useEffect(() => {
    const findIdentity = async () => {
      const address = await window?.arweaveWallet?.getActiveAddress();

      const myIdentity = response?.identities?.find((identity: Identity) => identity.arweave_address === address);
      if (myIdentity) {
        setIdentity(myIdentity);

        const arweaveAddress: Address = {
          address: identity.arweave_address,
          ark_key: "ARWEAVE",
          is_evaluated: true,
          is_verified: true,
          network: 'ARWEAVE-MAINNET',
          verification_req: '',
        };
        setArweaveIdentity(arweaveAddress);
        setAddresses(myIdentity.addresses)
        // console.log(myIdentity)
      }
    }
    findIdentity()
  }, [response])

  useEffect(() => {
    setAddresses(
      identity?.addresses?.filter((address: Address) => address.network.includes(filterNetwork))
    );
  }, [filterNetwork])

  interface NETWORK {
    key: string;
    ark_key: 'ARWEAVE' | 'EVM' | 'EXOTIC'; // Arweave is purely for the UI
    name: string;
    ticker: string;
    icon_min: string;
    icon_max: string;
  };

  interface ChainInfoInterface {
    name: string;
    url:  string;
  }

  const ChainInfo = ({address}: {address: Address} ) => {
    const networkData = convertedNetworks[address.network];
    
    if (!networkData) return (<></>)
    return (
      <div className="col-span-2 flex items-center">
        <Image src={networkData.iconURL} width={38} height={38} draggable={false} style={{borderRadius: "4px !important"}} />
        <div className="ml-3">{networkData.name}</div>
      </div>
    )
  }

  interface ConnectionStatusInterface {
    is_verified: boolean | undefined;
  };

  const ConnectionStatus = ({is_verified}: ConnectionStatusInterface) => (
    <div className="col-span-2 flex items-center select-none">
      <div className={`${is_verified ? "bg-green-300 ": "bg-red-500"} rounded-full w-[15px] h-[15px]`}></div>
      <div className="ml-2">{is_verified ? "" : "not "} connected</div>
    </div>
  )

  const AddressComponent = ({address}: {address: Address}) => {

    const formattedAddress = useMemo(
      () => formatAddress(address.address),
      [address]
    )

    return (
      <div className={`
        col-span-5 py-0.5 px-2.5 ml-12 font-light 
        ${address.ark_key === "ARWEAVE" ? "bg-[#1D3135]" : "bg-[#304C52]"}
      `}>
        {formattedAddress}
      </div>  
    )
  }

  const ChainAction = ({address}: {address: Address}) => {

    const [loading, setLoading] = useState<boolean | null>(null)
    const [connected, setConnected] = useState(true);

    const disconnect = async () => {
      if (arweaveIdentity) {
        setLoading(true)
        const payload = {
          "function": "unlinkIdentity",
          "caller": arweaveIdentity?.address,
          "address": address.address,
        }
        const result = await axios.post('api/exmwrite', payload);
        console.log(result)
        setConnected(!connected)
        setLoading(false)
      }
    }

    return (
      <>
        {address.ark_key === "ARWEAVE" && 
          <div className="col-span-2 italic text-gray-400 font-light select-none">
            master ID
          </div>
        }
        {(address.ark_key === "EVM" || address.ark_key === "EXOTIC") && 
          <button 
            onClick={() => connected ? disconnect(): router.push('/')} 
            className={`
              col-span-2 font-light py-1 select-none rounded-xl
              ${connected ? 
                "bg-red-500 hover:bg-red-600": 
                "bg-[rgb(38,191,168)] hover:bg-[rgb(38,191,168)]/80"
              }
            `}
          >
            {connected ? (
              <>
                {(loading === null || loading === false) && "disconnect"}
                {loading && "disconnecting..."}
              </>
            ): "connect"}
          </button>
        }
      </>
    )
  }

  const Connection = ({address}: {address: Address}) => {

    return (
      <li className={`${address.ark_key !== "ARWEAVE" && "bg-[rgb(35,54,58)]"} border-[3px] border-[rgb(35,54,58)] w-full rounded-2xl px-4 py-2 grid grid-cols-12 mb-3 items-center`}>
        <ChainInfo address={address} />
        <AddressComponent address={address} />
        <div className="col-span-1"></div>
        <ConnectionStatus is_verified={address.is_verified} />
        <ChainAction address={address} />
      </li>
    )
  };

  return (
    <div className="flex flex-col justify-center text-center text-white">
      <div className="mt-20 mb-[60px]">
        <h1 className="text-[32px] font-bold">Ark Connections</h1>
        <h2>Manage your connected addresses</h2>
      </div>
      {loading === true && (<div>loading</div>)}
      {loading === false && (
        <div className="flex flex-col self-center md:w-[800px] relative">
          <button onClick={() => setIsFilterMenuOpen(prev => !prev)} className="self-end mb-2 flex items-center">
            {/* <div className="mr-2">Filter</div> */}
            <AdjustmentsHorizontalIcon className="w-6 h-6 text-[#A6A6A6]" />
          </button>
          {isFilterMenuOpen && (
            <ul className="absolute w-40 right-0 top-8 bg-black rounded-lg px-2 pt-2 flex flex-col">
              {filterNetwork !== "" &&
                <li className="mb-2 self-end">
                  <button 
                    onClick={() => setFilterNetwork('')}
                    className="flex items-center bg-[rgb(35,54,58)] pl-2 pr-1 rounded-lg"
                  >
                    <div className='mr-1'>Clear</div>
                    <XCircleIcon className="w-5 h-5 " />
                  </button>
                </li>
              }
              {addresses?.map((address: Address, idx: number) => (
                <li
                  key={idx}
                  onClick={() => setFilterNetwork(address.network)} 
                  className="mb-2 transition-all ease-in-out duration-150 rounded-lg hover:bg-gray-700 cursor-pointer"
                >
                  <ChainInfo address={address} />
                </li>
              ))}
            </ul>
          )}

          <ul className="flex flex-col">
            {arweaveIdentity !== undefined && <Connection address={arweaveIdentity} />}
            {addresses?.map((address: Address, idx: number) => (
              <Fragment key={idx}>
                <Connection address={address} />
              </Fragment>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Connections