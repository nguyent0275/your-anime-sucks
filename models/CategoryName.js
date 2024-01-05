const { Model, DataTypes } = require("sequelize");

const sequelize = require("../config/connection");

class CategoryName extends Model {}

CategoryName.init(
  {
    anime_name: {
      type: DataTypes.INTEGER,
      references: {
        model: "anime",
        key: "id",
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "category",
        key: "category_id",
      },
    },
  },
  {
    sequelize,
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    modelName: "category_name",
  }
);

module.exports = CategoryName;