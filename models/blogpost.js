"use strict";

module.exports = function(sequelize, DataTypes) {
  var Post = sequelize.define("Post", {
    title: DataTypes.STRING,
    text: DataTypes.STRING,
    author: DataTypes.STRING,
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    classMethods: {
      associate: function(models) {
        Post.hasMany( models.Comment );
        Post.belongsTo( models.User, { as: "Author", foreignKey: 'PostAuhor' } );
        Post.belongsToMany(models.User, {as: 'UserLikes', through: 'PostLikes'});
      }
    }
  }, {
    getterMethods: {
      likes: function() {
        return this.UserLikes.length;
      }
    }
  });

  return Post;
};
