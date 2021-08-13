module.exports = class APIFeatures {
  constructor(query, queryObject) {
    this.query = query;
    this.queryObject = queryObject;
  }

  filter() {
    // BUILD QUERY
    let queryObj = Object.assign({}, this.queryObject);
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // ADVANCED FILTERING
    const queryStr = JSON.stringify(queryObj);
    queryObj = JSON.parse(
      queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`)
    );

    this.query = this.query.find(queryObj);
    return this;
  }

  sort() {
    if (Object.prototype.hasOwnProperty.call(this.queryObject, 'sort')) {
      const sortBy = this.queryObject.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  fields() {
    if (Object.prototype.hasOwnProperty.call(this.queryObject, 'fields')) {
      const fieldsBy = this.queryObject.fields.split(',').join(' ');
      this.query = this.query.select(fieldsBy);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const limit = Number(this.queryObject.limit) || 5;
    const currentPage = Number(this.queryObject.page) || 1;
    const numOfPageSkip = currentPage - 1;
    const numOfDocumentSkip = numOfPageSkip * limit;
    this.query = this.query.skip(numOfDocumentSkip).limit(limit);

    return this;
  }
};
