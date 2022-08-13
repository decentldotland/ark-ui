import axios from "axios";
import { ARWEAVE_CONTRACT } from "./constants";

const verificationsGraph = async (after=null) => {
  let query = "";
  if (after) {
    query = `query {
            transactions(
                owners:["vZY2XY1RD9HIfWi8ift-1_DnHLDadZMWrufSh-_rKF0"]
                tags: [
                      { name: "App-Name", values: "SmartWeaveAction"},
                      { name: "Contract", values: "${ARWEAVE_CONTRACT}"},
                      { name: "Protocol-Name", values: "Ark-Network"},
                      { name: "Protocol-Action", values: "Verify-Telegram"}
                      ],
                first: 100,
                after: "${after}"
            ) {
                edges {
                    node {
                        id
                        owner { address }
                        tags { name value }
                        block { timestamp height }
                    },
                cursor
                }
            }
        }`;
  } else {
    query = `query {
            transactions(
                owners:["vZY2XY1RD9HIfWi8ift-1_DnHLDadZMWrufSh-_rKF0"]
                tags: [
                      { name: "App-Name", values: "SmartWeaveAction"},
                      { name: "Contract", values: "${ARWEAVE_CONTRACT}"},
                      { name: "Protocol-Name", values: "Ark-Network"},
                      { name: "Protocol-Action", values: "Verify-Telegram"}
                      ],
                first: 100
            ) {
                edges {
                    node {
                        id
                        owner { address }
                        tags { name value }
                        block { timestamp height }
                    },
                cursor
                }
            }
        }`;
  }

  const url = "https://arweave.net/graphql";
  const response = await axios.post(
    url,
    { query },
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  return await response.data;
};

async function getLastVerificationsOf(address:any) {
  try {
    const firstFetch = await verificationsGraph();
    const firstEdges = firstFetch?.data?.transactions?.edges || [];
    const results = [...firstEdges];
    const res2 = [];

    if (results.length === 100) {
      const getEdgesLength = () => results.length;

      while (true) {
        const lastCursor = results[getEdgesLength() - 1]?.cursor;

        if (lastCursor) {
          const nextFetch = await verificationsGraph(lastCursor);
          const currentEdges = nextFetch?.data?.transactions?.edges || [];
          const currentEdgeLength = currentEdges.length || 0;

          if (currentEdgeLength === 0) {
            break;
          }

          results.push(...currentEdges);
        }
      }
    }

    const res1 = results.map((node) => node.node);

    for (const element of res1) {
      res2.push({
        txid: element.id,
        // pending transactions do not have block value
        timestamp: element.block ? element.block.timestamp : Date.now(),
        blockheight: element.block ? element.block.height : Date.now(),
        tags: element.tags ? element.tags : [],
      });
    }

    const finalRes = res2.filter(
      (tx) => JSON.parse(tx.tags?.[3]?.value)?.identityOf === address
    );

    for (const tx of finalRes) {
      // @ts-ignore
      tx.verification_result = JSON.parse(tx.tags?.[3]?.value)?.validity;
      delete tx.tags;
    }
    
    return finalRes.sort((a, b) => b?.timestamp - a?.timestamp);
  } catch (error) {
    console.log(error);
  }
}

export default getLastVerificationsOf;