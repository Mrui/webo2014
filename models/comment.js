"use strict";

module.exports = function(sequelize, DataTypes) {
  var Comment = sequelize.define("Comment", {
    text: DataTypes.STRING,
    author: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Comment.belongsTo(models.User, { foreignkey: 'username'});
      }
    }
  });

  return Comment;
};
