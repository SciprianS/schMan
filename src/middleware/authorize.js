const { ForbiddenError } = require('@casl/ability');
const defineAbilityFor   = require('../abilities/defineAbility');

module.exports = function authorize(action, subject) {
  return (req, res, next) => {
    const ability = defineAbilityFor(req.user);

    try {
      ForbiddenError.from(ability).throwUnlessCan(action, subject);
      req.ability = ability; // transmitem ability spre controller
      next();
    } catch (err) {
      return res.status(403).json({
        error: `Acces interzis: actiunea '${action}' pe '${subject}'.`
      });
    }
  };
};
