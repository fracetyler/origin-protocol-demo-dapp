import React, { Component, Fragment } from 'react'
import {
  FormattedDate,
  FormattedMessage,
  defineMessages,
  injectIntl
} from 'react-intl'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import CompactMessages from 'components/compact-messages'
import PurchaseProgress from 'components/purchase-progress'

import { getDataUri } from 'utils/fileUtils'
import { getListing } from 'utils/listing'

import origin from '../services/origin'

class Conversation extends Component {
  constructor(props) {
    super(props)

    this.intlMessages = defineMessages({
      newMessagePlaceholder: {
        id: 'Messages.newMessagePlaceholder',
        defaultMessage: 'Type something...'
      }
    })

    this.handleClick = this.handleClick.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.sendMessage = this.sendMessage.bind(this)

    this.conversationDiv = React.createRef()
    this.fileInput = React.createRef()
    this.form = React.createRef()
    this.textarea = React.createRef()

    this.state = {
      counterparty: {},
      files: [],
      listing: {},
      purchase: {}
    }
  }

  componentDidMount() {
    // try to detect the user before rendering
    this.identifyCounterparty()
  }

  componentDidUpdate(prevProps) {
    const { id, messages, users } = this.props

    // on conversation change
    if (id !== prevProps.id) {
      // textarea is an uncontrolled component and might maintain internal state
      (this.textarea.current || {}).value = ''
      // refresh the counterparty
      this.identifyCounterparty()
      // refresh the listing/purchase context
      this.loadListing()
    }

    // on new message
    if (messages.length > prevProps.messages.length) {
      this.loadListing()
      // auto-scroll to most recent message
      this.scrollToBottom()
    }

    // on user found
    if (users.length > prevProps.users.length) {
      this.identifyCounterparty()
    }
  }

  handleClick() {
    this.fileInput.current.click()
  }

  async handleInput(event) {
    const filesObj = event.target.files
    const filesArr = []

    for (const key in filesObj) {
      if (filesObj.hasOwnProperty(key)) {
        filesArr.push(filesObj[key])
      }
    }

    const filesAsDataUriArray = filesArr.map(async fileObj =>
      getDataUri(fileObj)
    )

    Promise.all(filesAsDataUriArray).then(dataUriArray => {
      this.setState({
        files: dataUriArray
      })
    })
  }

  handleKeyDown(e) {
    const { key, shiftKey } = e

    if (!shiftKey && key === 'Enter') {
      this.handleSubmit(e)
    }
  }

  handleSubmit(e) {
    e.preventDefault()

    const el = this.textarea.current

    if (!el) {
      return this.sendMessage(this.state.files[0])
    }

    const newMessage = el.value

    if (!newMessage.length) {
      alert('Please add a message to send')
    } else {
      this.sendMessage(newMessage)
    }
  }

  identifyCounterparty() {
    const { id, users, web3Account } = this.props
    const recipients = origin.messaging.getRecipients(id)
    const address = recipients.find(addr => addr !== web3Account)
    const counterparty = users.find(u => u.address === address) || {}

    this.setState({ counterparty })
    this.loadPurchase()
  }

  async loadListing() {
    const { messages } = this.props
    // Find the most recent listing context or set empty value.
    const { listingId } = [...messages].reverse().find(m => m.listingId) || {}

    // If listingId does not match state, store and check for a purchase.
    if (listingId !== this.state.listing.id) {
      const listing = listingId ? await getListing(listingId, true) : {}
      this.setState({ listing })
      this.loadPurchase()
      this.scrollToBottom()
    }
  }

  async loadPurchase() {
    const { web3Account } = this.props
    const { counterparty, listing, purchase } = this.state

    // listing may not be found
    if (!listing.id) {
      return this.setState({ purchase: {} })
    }

    const offers = await origin.marketplace.getOffers(listing.id)
    const flattenedOffers = offers.map(o => {
      return { ...o, ...o.ipfs.data }
    })
    const involvingCounterparty = flattenedOffers.filter(
      o => o.buyer === counterparty.address || o.buyer === web3Account
    )
    const mostRecent = involvingCounterparty.sort(
      (a, b) => (a.createdAt > b.createdAt ? -1 : 1)
    )[0]
    // purchase may not be found
    if (!mostRecent) {
      return this.setState({ purchase: {} })
    }
    // compare with existing state
    if (
      // purchase is different
      mostRecent.id !== purchase.id ||
      // stage has changed
      mostRecent.status !== purchase.status
    ) {
      this.setState({ purchase: mostRecent })
      this.scrollToBottom()
    }
  }

  scrollToBottom() {
    const el = this.conversationDiv.current

    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }

  async sendMessage(content) {
    try {
      await origin.messaging.sendConvMessage(this.props.id, content)

      this.form.current.reset()

      if (this.state.files.length) {
        this.setState({ files: [] })
      }
    } catch (err) {
      console.error(err)
    }
  }

  render() {
    const { id, intl, messages, web3Account, withListingSummary } = this.props
    const { counterparty, files, listing, purchase } = this.state
    const { name, pictures } = listing
    const { buyer, createdAt, status } = purchase
    const perspective = buyer
      ? buyer === web3Account
        ? 'buyer'
        : 'seller'
      : null
    const soldAt = createdAt
      ? createdAt * 1000 /* convert seconds since epoch to ms */
      : null
    const photo = pictures && pictures.length > 0 && pictures[0]
    const canDeliverMessage = origin.messaging.canConverseWith(
      counterparty.address
    )
    const shouldEnableForm =
      origin.messaging.getRecipients(id).includes(web3Account) &&
      canDeliverMessage &&
      id

    return (
      <Fragment>
        {withListingSummary &&
          listing.id && (
          <div className="listing-summary d-flex">
            <div className="aspect-ratio">
              <div
                className={`${
                  photo ? '' : 'placeholder '
                }image-container d-flex justify-content-center`}
              >
                <img
                  src={photo || 'images/default-image.svg'}
                  role="presentation"
                />
              </div>
            </div>
            <div className="content-container d-flex flex-column">
              {buyer && (
                <div className="brdcrmb">
                  {perspective === 'buyer' && (
                    <FormattedMessage
                      id={'purchase-summary.purchasedFrom'}
                      defaultMessage={'Purchased from {sellerLink}'}
                      values={{
                        sellerLink: (
                          <Link to={`/users/${counterparty.address}`}>
                            {counterparty.fullName}
                          </Link>
                        )
                      }}
                    />
                  )}
                  {perspective === 'seller' && (
                    <FormattedMessage
                      id={'purchase-summary.soldTo'}
                      defaultMessage={'Sold to {buyerLink}'}
                      values={{
                        buyerLink: (
                          <Link to={`/users/${counterparty.address}`}>
                            {counterparty.fullName}
                          </Link>
                        )
                      }}
                    />
                  )}
                </div>
              )}
              <h1>{name}</h1>
              {buyer && (
                <div className="state">
                  {perspective === 'buyer' && (
                    <FormattedMessage
                      id={'purchase-summary.purchasedFromOn'}
                      defaultMessage={'Purchased from {sellerName} on {date}'}
                      values={{
                        sellerName: counterparty.fullName,
                        date: <FormattedDate value={soldAt} />
                      }}
                    />
                  )}
                  {perspective === 'seller' && (
                    <FormattedMessage
                      id={'purchase-summary.soldToOn'}
                      defaultMessage={'Sold to {buyerName} on {date}'}
                      values={{
                        buyerName: counterparty.fullName,
                        date: <FormattedDate value={soldAt} />
                      }}
                    />
                  )}
                </div>
              )}
              {buyer && (
                <PurchaseProgress
                  purchase={purchase}
                  perspective={perspective}
                  subdued={true}
                  currentStep={parseInt(status)}
                  maxStep={perspective === 'buyer' ? 3 : 4}
                />
              )}
            </div>
          </div>
        )}
        <div ref={this.conversationDiv} className="conversation">
          <CompactMessages messages={messages} />
        </div>
        {!shouldEnableForm && (
          <form className="add-message d-flex">
            <textarea tabIndex="0" disabled />
            <button type="submit" className="btn btn-sm btn-primary" disabled>
              Send
            </button>
          </form>
        )}
        {shouldEnableForm && (
          <form
            ref={this.form}
            className="add-message d-flex"
            onSubmit={this.handleSubmit}
          >
            {!files.length && (
              <textarea
                ref={this.textarea}
                placeholder={intl.formatMessage(
                  this.intlMessages.newMessagePlaceholder
                )}
                onKeyDown={this.handleKeyDown}
                tabIndex="0"
                autoFocus
              />
            )}
            {!!files.length && (
              <div className="files-container">
                {files.map((dataUri, i) => (
                  <img src={dataUri} key={i} className="preview-thumbnail" />
                ))}
              </div>
            )}
            <img
              src="images/add-photo-icon.svg"
              className="add-photo"
              role="presentation"
              onClick={this.handleClick}
            />
            <input
              type="file"
              ref={this.fileInput}
              className="d-none"
              onChange={this.handleInput}
            />
            <button type="submit" className="btn btn-sm btn-primary">
              Send
            </button>
          </form>
        )}
      </Fragment>
    )
  }
}

const mapStateToProps = state => {
  return {
    users: state.users,
    web3Account: state.app.web3.account
  }
}

export default connect(mapStateToProps)(injectIntl(Conversation))
