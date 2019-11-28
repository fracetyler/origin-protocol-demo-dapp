import React, { Component } from 'react'
import { connect } from 'react-redux'
import { injectIntl, FormattedMessage } from 'react-intl'
import $ from 'jquery'

import MultipleSelectionFilter from 'components/search/multiple-selection-filter'
import PriceFilter from 'components/search/price-filter'
import CounterFilter from 'components/search/counter-filter'
import DateFilter from 'components/search/date-filter'
import { updateFilters } from 'actions/Search'

class FilterGroup extends Component {
  constructor(props) {
    super(props)

    this.childFilters = []

    this.title = this.props.intl.formatMessage(this.props.filterGroup.title)
    this.handleFilterMounted = this.handleFilterMounted.bind(this)
    this.handleFilterUnMounted = this.handleFilterUnMounted.bind(this)
    this.handleApplyClick = this.handleApplyClick.bind(this)
    this.handleClearClick = this.handleClearClick.bind(this)
    this.handleOpenDropdown = this.handleOpenDropdown.bind(this)
  }

  resolveFromListingSchema(path) {
    const properties = Array.isArray(path) ? path : path.split('.')
    return properties.reduce(
      (prev, curr) => prev && prev[curr],
      this.props.listingSchema
    )
  }

  handleFilterMounted(filter) {
    this.childFilters.push(filter)
  }

  handleFilterUnMounted(filter) {
    const index = this.childFilters.indexOf(filter)
    if (index !== -1) this.childFilters.splice(index, 1)
  }

  async handleApplyClick(event) {
    event.preventDefault()

    Promise.all(
      this.childFilters.map(childFilter => childFilter.getFilters())
    ).then(values => {
      const filters = values.flatMap(childFilters => childFilters)
      this.props.updateFilters(this.title, filters)

      // close the dropdown menu. Handles the css clases and aria-expanded attribute
      $('body').trigger('click')
    })
  }

  async handleClearClick(event) {
    event.preventDefault()

    this.childFilters
      // Also trigger the filter state chenge as you would with clicking apply
      .forEach(childFilter =>
        childFilter.onClear(async () => {
          await this.handleApplyClick(event)
        })
      )
  }

  handleOpenDropdown() {
    const containsDateFilter = this.props.filterGroup.items.some(
      filter => filter.type === 'date'
    )
    if (!containsDateFilter) return

    /* Because of a workaround in `react-dates` module we need to message the DateFilter
     * when it gets shown - when dropdown containing date filter is opened
     */
    this.childFilters
      .filter(filter => filter.props.filter.type === 'date')
      .forEach(dateFilter => dateFilter.onOpen())
  }

  renderFilter(filter, title, index) {
    if (filter.type === 'multipleSelectionFilter') {
      return (
        <MultipleSelectionFilter
          filter={filter}
          multipleSelectionValues={this.resolveFromListingSchema(
            filter.listingPropertyName
          )}
          listingType={this.props.listingType}
          title={title}
          onChildMounted={this.handleFilterMounted}
          onChildUnMounted={this.handleFilterUnMounted}
          key={index}
        />
      )
    } else if (filter.type === 'price') {
      return (
        <PriceFilter
          filter={filter}
          onChildMounted={this.handleFilterMounted}
          onChildUnMounted={this.handleFilterUnMounted}
          key={index}
          maxPrice={this.props.maxPrice}
          minPrice={this.props.minPrice}
        />
      )
    } else if (filter.type === 'counter') {
      return (
        <CounterFilter
          filter={filter}
          onChildMounted={this.handleFilterMounted}
          onChildUnMounted={this.handleFilterUnMounted}
          key={index}
        />
      )
    } else if (filter.type === 'date') {
      return (
        <DateFilter
          filter={filter}
          onChildMounted={this.handleFilterMounted}
          onChildUnMounted={this.handleFilterUnMounted}
          key={index}
        />
      )
    } else {
      throw `Unrecognised filter type "${filter.type}".`
    }
  }

  render() {
    const formId = `filter-group-${this.title}`

    return (
      <li className="nav-item">
        <a
          onClick={this.handleOpenDropdown}
          className="nav-link"
          data-toggle="dropdown"
          data-parent="#search-filters-bar"
        >
          {this.props.intl.formatMessage(this.props.filterGroup.title)}
        </a>
        <form className="dropdown-menu" id={formId}>
          <div className="d-flex flex-column">
            <div className="dropdown-form">
              {this.props.filterGroup.items.map((filter, index) =>
                this.renderFilter(filter, this.title, index)
              )}
            </div>
            <div className="d-flex flex-row button-container">
              <a
                onClick={this.handleClearClick}
                className="dropdown-button dropdown-button-left align-middle"
              >
                <FormattedMessage
                  id={'SearchResults.filterGroup.searchFiltersClear'}
                  defaultMessage={'Clear'}
                />
              </a>
              <a
                onClick={this.handleApplyClick}
                className="dropdown-button dropdown-button-right align-middle align-self-center"
              >
                <FormattedMessage
                  id={'SearchResults.filterGroup.searchFiltersApply'}
                  defaultMessage={'Apply'}
                />
              </a>
            </div>
          </div>
        </form>
      </li>
    )
  }
}

const mapStateToProps = () => ({})

const mapDispatchToProps = dispatch => ({
  updateFilters: (filterGroupId, filters) =>
    dispatch(updateFilters(filterGroupId, filters))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(FilterGroup))
