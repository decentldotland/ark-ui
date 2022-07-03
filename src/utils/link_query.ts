const query = `
  query($owner: String!, $arkContract: [String!]!) {
    transactions(
      tags: [
        { name: "Protocol-Name", values: "Ark-Network" }
        { name: "Protocol-Action", values: "Link-Identity" }
        { name: "Contract", values: $arkContract }
      ]
      owners: [$owner]
    ) {
      edges {
        node {
          block {
            id
          }
        }
      }
    }
  }
`;

export default query;