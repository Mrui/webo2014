"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    username: {
      type: DataTypes.STRING,
      allowNull: false, unique: true,
      validate: {
        isAlphanumeric: { msg: "UserNameError" },
        isLowercase: { msg: "UserNameError" } }
      },
      name: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false }
    }, {
      classMethods: {
        associate: function(models) {
          // Tässä voi assosioida malleja toisiinsa
          // http://sequelize.readthedocs.org/en/latest/docs/associations/
          User.belongsToMany(models.Post, {as: 'AuthoredPosts', foreignKey: 'PostAuhor'});
          User.belongsToMany(models.Post, {as: 'LikedPosts', through: 'PostLikes'});
          // User.belongsTo(models.Blog, {as: 'DefaultBlog'});
          User.belongsToMany(models.Blog, {as: 'AuthoredBlogs', through: 'BlogAuthors'});
          User.belongsToMany(models.Blog, {as: 'Follows', through: 'BlogFollows'});
          User.hasMany(models.Comment);
        }
      }
    });

    return User;
  };
