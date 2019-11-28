import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import $ from 'jquery'
import moment from 'moment'
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl'

import { fetchUser } from 'actions/User'

import PurchaseProgress from 'components/purchase-progress'
import UnnamedUser from 'components/unnamed-user'

import { offerStatusToStep } from 'utils/offer'

class MySaleCard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      soldAtTime: null
    }

    this.setSoldAtTime = this.setSoldAtTime.bind(this)

    this.intlMessages = defineMessages({
      ETH: {
        id: 'my-sale-card.ethereumCurrencyAbbrev',
        defaultMessage: 'ETH'
      }
    })
  }

  componentWillMount() {
    this.props.fetchUser(this.props.purchase.buyer)
  }

  componentDidMount() {
    $('[data-toggle="tooltip"]').tooltip()
  }

  setSoldAtTime(soldAt) {
    this.setState({
      soldAtTime: moment(soldAt).fromNow()
    })
  }

  componentWillUnmount() {
    $('[data-toggle="tooltip"]').tooltip('dispose')
  }

  render() {
    const { listing, purchase, user } = this.props
    const { id: purchaseId, createdAt, status } = purchase

    if (!listing) {
      console.error(`Listing not found for purchase ${purchaseId}`)
      return null
    }

    const { name, pictures, price } = listing
    const buyerName = (user &&
      user.profile &&
      `${user.profile.firstName} ${user.profile.lastName}`) || <UnnamedUser />
    const photo = pictures && pictures.length > 0 && pictures[0]
    const voided = ['rejected', 'withdrawn'].includes(status)
    const completed = ['finalized', 'sellerReviewed'].includes(status)
    const pending = !voided && !completed
    const step = offerStatusToStep(status)

    return (
      <div className="sale card">
        <div className="card-body">
          <div className="d-flex flex-column flex-lg-row">
            <div className="purchase order-3 order-lg-1">
              <h2 className="title">
                <Link to={`/purchases/${purchaseId}`}>{name}</Link>
              </h2>
              <h2 className="title">
                {pending && (
                  <FormattedMessage
                    id={'my-sale-card.pendingBuyerNameLink'}
                    defaultMessage={'selling to {linkToBuyer}'}
                    values={{
                      linkToBuyer: (
                        <Link to={`/users/${user.address}`}>{buyerName}</Link>
                      )
                    }}
                  />
                )}
                {completed && (
                  <FormattedMessage
                    id={'my-sale-card.completedBuyerNameLink'}
                    defaultMessage={'sold to {linkToBuyer}'}
                    values={{
                      linkToBuyer: (
                        <Link to={`/users/${user.address}`}>{buyerName}</Link>
                      )
                    }}
                  />
                )}
              </h2>
              <p className="address text-muted">{user.address}</p>
              <div className="d-flex">
                <p className="price">
                  <FormattedMessage
                    id={'my-sale-card.price'}
                    defaultMessage={'Price'}
                  />:&nbsp;{Number(price).toLocaleString(undefined, {
                    minimumFractionDigits: 5,
                    maximumFractionDigits: 5
                  })}
                </p>
                {/* Not Yet Relevant */}
                {/*<p className="quantity">Quantity: {quantity.toLocaleString()}</p>*/}
              </div>
            </div>
            <div className="timestamp-container order-2 text-muted text-right">
              <p className="timestamp">{moment(createdAt * 1000).fromNow()}</p>
            </div>
            <div className="aspect-ratio order-1 order-lg-3">
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
          </div>
          {!voided && (
            <PurchaseProgress
              maxStep={4}
              currentStep={step}
              perspective="seller"
              subdued={true}
            />
          )}
          <div className="d-flex justify-content-between actions">
            <p>
              {!voided && (
                <strong>
                  <FormattedMessage
                    id={'my-sale-card.nextStep'}
                    defaultMessage={'Next Step'}
                  />
                  :&nbsp;
                </strong>
              )}
              {status === 'created' && (
                <FormattedMessage
                  id={'my-sale-card.accept'}
                  defaultMessage={'Accept the offer'}
                />
              )}
              {status === 'accepted' && (
                <FormattedMessage
                  id={'my-sale-card.awaitConfirmation'}
                  defaultMessage={'Wait for the buyer to confirm the sale'}
                />
              )}
              {status === 'disputed' && (
                <FormattedMessage
                  id={'my-sale-card.awaitContact'}
                  defaultMessage={'Wait to be contacted'}
                />
              )}
              {status === 'finalized' && (
                <FormattedMessage
                  id={'my-sale-card.reviewSale'}
                  defaultMessage={'Review the sale'}
                />
              )}
              {status === 'sellerReviewed' && (
                <FormattedMessage
                  id={'my-sale-card.saleComplete'}
                  defaultMessage={'This sale is complete'}
                />
              )}
            </p>
            <p className="link-container">
              <Link to={`/purchases/${purchaseId}`}>
                <FormattedMessage
                  id={'my-sale-card.viewDetails'}
                  defaultMessage={'View Details'}
                />
                <img
                  src="images/carat-blue.svg"
                  className="carat"
                  alt="right carat"
                />
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, { purchase }) => {
  return {
    user: state.users.find(u => u.address === purchase.buyer) || {}
  }
}

const mapDispatchToProps = dispatch => ({
  fetchUser: (addr, msg) => dispatch(fetchUser(addr, msg))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(MySaleCard))
