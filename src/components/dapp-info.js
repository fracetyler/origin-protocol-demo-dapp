import React, { Component } from 'react'
import origin from '../services/origin'

class DappInfo extends Component {
  constructor() {
    super()
    this.state = {}
  }

  async loadMarketplaceData() {
    const contracts = []
    for (const [name, contract] of Object.entries(
      origin.contractService.marketplaceContracts
    )) {
      const contractObj = await origin.contractService.deployed(contract)
      const owner = await contractObj.methods.owner().call()
      const tokenAddr = await contractObj.methods.tokenAddr().call()
      contracts.push(
        <tr>
          <th>{name}</th><td></td>
        </tr>
      )
      contracts.push(
        <tr>
          <td>Contract Address</td>
          <td>{contractObj._address}</td>
        </tr>
      )
      contracts.push(
        <tr>
          <td>Owner</td>
          <td>{owner}</td>
        </tr>
      )
      contracts.push(
        <tr>
          <td>Token Address</td>
          <td>{tokenAddr}</td>
        </tr>
      )
    }
    return contracts
  }

  async loadTokenData() {
    const contract = origin.contractService.contracts['OriginToken']
    const token = await origin.contractService.deployed(contract)
    const owner = await token.methods.owner().call()
    const name = await token.methods.name().call()
    const symbol = await token.methods.symbol().call()
    const decimals = await token.methods.decimals().call()
    const totalSupply =
      (await token.methods.totalSupply().call()) / 10 ** decimals
    const paused = (await token.methods.paused().call()) ? 'YES' : 'no'
    let whitelistStatus
    if (await token.methods.whitelistActive().call()) {
      const expiration = await token.methods.whitelistExpiration().call()
      const expirationDate = new Date(expiration * 1000)
      whitelistStatus = `active until ${expirationDate}`
    } else {
      whitelistStatus = 'not active'
    }

    return (
      <React.Fragment>
        <tr>
          <td>Contract Address</td>
          <td>{token._address}</td>
        </tr>
        <tr>
          <td>Name</td>
          <td>{name}</td>
        </tr>
        <tr>
          <td>Symbol</td>
          <td>{symbol}</td>
        </tr>
        <tr>
          <td>Decimals</td>
          <td>{decimals}</td>
        </tr>
        <tr>
          <td>Total Supply</td>
          <td>{totalSupply}</td>
        </tr>
        <tr>
          <td>Owner</td>
          <td>{owner}</td>
        </tr>
        <tr>
          <td>Paused</td>
          <td>{paused}</td>
        </tr>
        <tr>
          <td>Transactor Whitelist</td>
          <td>{whitelistStatus}</td>
        </tr>
      </React.Fragment>
    )
  }

  async loadMultiSigData() {
    const data = []
    const bigStyle = {
      height: '100px',
      width: '100%',
      'font-family': 'monospace',
      display: 'table-caption',
      'font-size': '10px',
      'overflow-y': 'scroll'
    }
    for (const [name, contract] of Object.entries(
      origin.contractService.marketplaceContracts
    )) {
      const contractObj = await origin.contractService.deployed(contract)
      data.push(
        <tr>
          <td>{name} address</td>
          <td>{contractObj._address}</td>
        </tr>
      )
      data.push(
        <tr>
          <td>{name} ABI</td>
          <td>
            <textarea
              style={bigStyle}
              readOnly
              onFocus={e => e.target.select()}
            >
              {JSON.stringify(contract.abi)}
            </textarea>
          </td>
        </tr>
      )
    }

    const tokenContractName = 'OriginToken'
    const tokenContract = origin.contractService.contracts[tokenContractName]
    const token = await origin.contractService.deployed(tokenContract)
    data.push(
      <tr>
        <td>{tokenContractName} address </td>
        <td>{token._address}</td>
      </tr>
    )
    data.push(
      <tr>
        <td>{tokenContractName} ABI</td>
        <td>
          <textarea style={bigStyle} readOnly onFocus={e => e.target.select()}>
            {JSON.stringify(tokenContract.abi)}
          </textarea>
        </td>
      </tr>
    )
    return data
  }

  async componentDidMount() {
    this.loadMarketplaceData()
      .then(res =>
        this.setState(Object.assign(this.state, { marketplaceData: res }))
      )
      .catch(e =>
        this.setState(
          Object.assign(this.state, {
            marketplaceData: <tr><td colSpan="2">Error fetching marketplace data: {e.message}</td></tr>
          })
        )
      )
    this.loadTokenData()
      .then(res => this.setState(Object.assign(this.state, { tokenData: res })))
      .catch(e =>
        this.setState(
          Object.assign(this.state, {
            tokenData: <tr><td colSpan="2">Error fetching token data: {e.message}</td></tr>
          })
        )
      )
    this.loadMultiSigData()
      .then(res =>
        this.setState(Object.assign(this.state, { multiSigData: res }))
      )
      .catch(e =>
        this.setState(
          Object.assign(this.state, {
            multiSigData: <tr><td colSpan="2">Error fetching multi-sig data: {e.message}</td></tr>
          })
        )
      )
  }

  render() {
    return (
      <div className="dapp-info-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h1>DApp Info</h1>
              <h3 className="lead">Developer information about this build</h3>
              <table width="100%">
                <tr>
                  <th colSpan="2">origin.js</th>
                </tr>
                <tr>
                  <td>Version</td>
                  <td>{origin.version} </td>
                </tr>
                <tr>
                  <td>Latest npm version</td>
                  <td>
                    <a
                      href="https://www.npmjs.com/package/origin"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src="https://img.shields.io/npm/v/origin.svg?style=flat-square&colorA=111d28&colorB=1a82ff" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <th colSpan="2">Environment Variables</th>
                </tr>
                <tr>
                  <td>AFFILIATE_ACCOUNT</td>
                  <td>{process.env.AFFILIATE_ACCOUNT}</td>
                </tr>
                <tr>
                  <td>ARBITRATOR_ACCOUNT</td>
                  <td>{process.env.ARBITRATOR_ACCOUNT}</td>
                </tr>
                <tr>
                  <td>BRIDGE_SERVER_DOMAIN</td>
                  <td>{process.env.BRIDGE_SERVER_DOMAIN}</td>
                </tr>
                <tr>
                  <td>BRIDGE_SERVER_PROTOCOL</td>
                  <td>{process.env.BRIDGE_SERVER_PROTOCOL}</td>
                </tr>
                <tr>
                  <td>CONTRACT_ADDRESSES</td>
                  <td>{process.env.CONTRACT_ADDRESSES}</td>
                </tr>
                <tr>
                  <td>DEPLOY_TAG</td>
                  <td>{process.env.DEPLOY_TAG}</td>
                </tr>
                <tr>
                  <td>DISCOVERY_SERVER_URL</td>
                  <td>{process.env.DISCOVERY_SERVER_URL}</td>
                </tr>
                <tr>
                  <td>ETH_NETWORK_ID</td>
                  <td>{process.env.ETH_NETWORK_ID}</td>
                </tr>
                <tr>
                  <td>FORCE_HTTPS</td>
                  <td>{process.env.FORCE_HTTPS}</td>
                </tr>
                <tr>
                  <td>IPFS_API_PORT</td>
                  <td>{process.env.IPFS_API_PORT}</td>
                </tr>
                <tr>
                  <td>IPFS_DOMAIN</td>
                  <td>{process.env.IPFS_DOMAIN}</td>
                </tr>
                <tr>
                  <td>IPFS_GATEWAY_PORT</td>
                  <td>{process.env.IPFS_GATEWAY_PORT}</td>
                </tr>
                <tr>
                  <td>IPFS_GATEWAY_PROTOCOL</td>
                  <td>{process.env.IPFS_GATEWAY_PROTOCOL}</td>
                </tr>
                <tr>
                  <td>IPFS_SWARM</td>
                  <td>{process.env.IPFS_SWARM}</td>
                </tr>
                <tr>
                  <td>MESSAGING_ACCOUNT</td>
                  <td>{process.env.MESSAGING_ACCOUNT}</td>
                </tr>
                <tr>
                  <td>MESSAGING_NAMESPACE</td>
                  <td>{process.env.MESSAGING_NAMESPACE}</td>
                </tr>
                <tr>
                  <td>NODE_ENV</td>
                  <td>{process.env.NODE_ENV}</td>
                </tr>
                <tr>
                  <td>PROVIDER_URL</td>
                  <td>{process.env.PROVIDER_URL}</td>
                </tr>
                <tr>
                  <td>REDUX_LOGGER</td>
                  <td>{process.env.REDUX_LOGGER}</td>
                </tr>

                <tr>
                  <th colSpan="2">Marketplace Contracts</th>
                </tr>
                {this.state.marketplaceData}

                <tr>
                  <th colSpan="2">Token Contract</th>
                </tr>
                {this.state.tokenData}

                <tr>
                  <th colSpan="2">ABIs</th>
                </tr>
                {this.state.multiSigData}
              </table>
              &nbsp;
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default DappInfo
