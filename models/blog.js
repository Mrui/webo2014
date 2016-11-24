"use strict";

module.exports = function(sequelize, DataTypes) {
  var Blog = sequelize.define("Blog", {
    rid: {
      type: DataTypes.STRING,
      unique: true },
      name: DataTypes.STRING
    }, {
      classMethods: {
        associate: function(models) {
          Blog.hasMany(models.Post, {as: "Blogposts"});
          Blog.belongsToMany(models.User, {as: 'Authors', through: 'BlogAuthors'});
          Blog.belongsToMany(models.User, {as: 'Follows', through: 'BlogFollows'});
        }
      }
    });

    return Blog;
  };
