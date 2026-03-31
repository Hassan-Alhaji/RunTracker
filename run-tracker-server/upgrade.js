const { User } = require('./database');

async function upgradeUser() {
  try {
    const user = await User.findOne({ where: { email: 'al3ren0@hotmail.com' } });
    if (user) {
       user.role = 'admin';
       await user.save();
       console.log('User upgraded to admin!');
    } else {
       console.log('User not found.');
    }
  } catch (err) {
    console.error(err);
  }
}

upgradeUser();
