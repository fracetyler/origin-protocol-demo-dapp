import moment from 'moment'
import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import { connect } from 'react-redux'

import { enableMessaging } from 'actions/App'
import { updateMessage } from 'actions/Message'

import Avatar from 'components/avatar'

class Message extends Component {
  componentDidMount() {
    const { message } = this.props

    if (message.status === 'unread') {
      this.props.updateMessage({ ...message, status: 'read' })
    }
  }

  render() {
    const {
      enableMessaging,
      message,
      messagingEnabled,
      user,
      contentOnly
    } = this.props
    const { created, hash } = message
    const { address, fullName, profile } = user

    return contentOnly ? (
      <div className="d-flex compact-message">{this.renderContent()}</div>
    ) : (
      <div className="d-flex message">
        <Avatar image={profile && profile.avatar} placeholderStyle="blue" />
        <div className="content-container">
          <div className="meta-container d-flex">
            <div className="sender text-truncate">
              {fullName && <span className="name">{fullName}</span>}
              <span className="address text-muted">{address}</span>
            </div>
            <div className="timestamp text-right ml-auto">
              {moment(created).format('MMM Do h:mm a')}
            </div>
          </div>
          <div className="message-content">{this.renderContent()}</div>
          {!messagingEnabled &&
            hash === 'origin-welcome-message' && (
            <div className="button-container">
              <button
                className="btn btn-sm btn-primary"
                onClick={enableMessaging}
              >
                <FormattedMessage
                  id={'message.enable'}
                  defaultMessage={'Enable Messaging'}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  renderContent() {
    const { content } = this.props.message
    const contentWithLineBreak = `${content}\n`
    const contentIsData = content.match(/^data:/)
    const dataIsImage = contentIsData && content.match(/^data:image/)

    if (!contentIsData) {
      return contentWithLineBreak
    } else if (!dataIsImage) {
      return (
        <FormattedMessage
          id={'message.unrecognizedData'}
          defaultMessage={'This data cannot be rendered.'}
        />
      )
    } else {
      const fileName = content.match(/name=.+;/).slice(5, -1)

      return (
        <div className="image-container">
          <img src={content} alt={fileName} />
        </div>
      )
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    messagingEnabled: state.app.messagingEnabled,
    user:
      state.users.find(u => u.address === ownProps.message.senderAddress) || {}
  }
}

const mapDispatchToProps = dispatch => ({
  enableMessaging: () => dispatch(enableMessaging()),
  updateMessage: obj => dispatch(updateMessage(obj))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Message)
