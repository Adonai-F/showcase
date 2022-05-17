import express from 'express';
const router = express.Router();
import passport from 'passport';

import Contact from '../Models/contact';
import User from '../Models/user';
import { AuthGuard, UserDisplayName } from '../Util/index';

/* GET home page. */
router.get('/', function(req, res, next) 
{
  res.render('index', { title: 'Home', page: 'home', displayName: UserDisplayName(req) });
});

/* GET home page. */
router.get('/home', function(req, res, next) 
{
  res.render('index', { title: 'Home', page: 'home', displayName: UserDisplayName(req) });
});

/* GET about page. */
router.get('/about', function(req, res, next) 
{
  res.render('index', { title: 'About Us', page: 'about', displayName: UserDisplayName(req) });
});

/* GET services page. */
router.get('/services', function(req, res, next) 
{
  res.render('index', { title: 'Our Services', page: 'services', displayName: UserDisplayName(req) });
});

/* GET Projects page. */
router.get('/projects', function(req, res, next) 
{
  res.render('index', { title: 'My Projects', page: 'projects', displayName: UserDisplayName(req) });
});

/* GET products page. */
router.get('/contact', function(req, res, next) 
{
  res.render('index', { title: 'Contact Us', page: 'contact', displayName: UserDisplayName(req) });
});

/*************************************** AUTHENTICATION ROUTES************************************************/
/* GET - Display login page. */
router.get('/login', function(req, res, next) 
{
  if(!req.user)
  {
    return res.render('index', 
      { title: 'Login', page: 'login', messages: req.flash('loginMessage'), displayName: UserDisplayName(req) });
  }
  return res.redirect('/contact-list');
});

/* Process the login request */
router.post('/login', function(req, res, next) 
{
  passport.authenticate('local', function(err, user, info)
  {
    // are there serer errors?
    if(err)
    {
      console.error(err);
      res.end(err);
    }
    
    // are there login errors?
    if(!user)
    {
      req.flash('loginMessage', 'Authentication Error');
      return res.redirect('/login');
    }

    req.logIn(user, function(err)
    {
      // are there db errors?
      if(err)
      {
        console.error(err);
        res.end(err);
      }

      return res.redirect('/contact-list')
    });
  })(req, res, next);
});

/* GET - Display register page. */
router.get('/register', function(req, res, next) 
{
  if(!req.user)
  {
  return res.render('index', 
    { title: 'Register', page: 'register', messages: req.flash('registerMessage'), displayName: UserDisplayName(req) });
  }
  return res.redirect('/contact-list');
});

/* Process the register request */
router.post('/register', function(req, res, next) 
{
  // instantiate a new user object
  let newUser = new User
  ({
    username: req.body.username,
    EmailAddress: req.body.emailAddress,
    DisplayName: req.body.firstName + " " + req.body.lastName
  });

  User.register(newUser, req.body.password, function(err)
  {
    if(err)
    {
      if(err.name == "UserExistsError")
      {
        console.error('ERROR: Inserting User');
        req.flash('registerMessage', 'Registration Error');
        console.error('ERROR: User Already Exists');
      }
      req.flash('registerMessage', ' Please Try Again');
      console.error(err.name);
      return res.redirect('/register');
    }
    
    // automatically login the user
    return passport.authenticate('local')(req, res, ()=>
    {
      return res.redirect('/contact-list');
    });
  });
});

/* process logout request */
router.get('/logout', function(req, res, next) 
{
  req.logOut();

  res.redirect('/login');
});

/* Temporary Routes - Contact-List related pages */
/*************************************** CONTACT-LIST ROUTES************************************************/
/* GET contact-list page. */
router.get('/contact-list', AuthGuard, function(req, res, next) 
{
  // R - Read
  Contact.find(function(err, contactList)
  {
    if(err)
    {
      console.error("Error Encountered: " + err.message);
      res.end();
    }

    res.render('index', 
      { title: 'Contact List', page: 'contact-list', contacts: contactList, displayName: UserDisplayName(req) });
  });

 
});

/* Display the Add page. */
router.get('/add', AuthGuard, function(req, res, next) 
{
  res.render('index', { title: 'Add', page: 'edit', contact: '', displayName: UserDisplayName(req) });
});

/* Prrocess the Add request */
router.post('/add', AuthGuard, function(req, res, next) 
{
  // instantiate a new contact to add
  let newContact = new Contact
  ({
    "FullName": req.body.fullName,
    "ContactNumber": req.body.contactNumber,
    "EmailAddress": req.body.emailAddress
  });

  // db.contacts.insert
  Contact.create(newContact, function(err)
  {
    if(err)
    {
      console.error(err);
      res.end(err);
    }
    // newContact has been added to the db -> now go back to the contact-list
    res.redirect('/contact-list');
  });
});

/* Display the Edit page with data from DB */
router.get('/edit/:id', AuthGuard, function(req, res, next) 
{
  let id = req.params.id;

  // pass the id to the db and read the contact in
  Contact.findById(id, {}, {}, function(err, contactToEdit)
  {
    if(err)
    {
      console.error(err);
      res.end(err);
    }

    // show the edit view with the data
    res.render('index', { title: 'Edit', page: 'edit', contact: contactToEdit, displayName: UserDisplayName(req) });
  });  
});

/* Process the Edit request */
router.post('/edit/:id', AuthGuard, function(req, res, next) 
{
  let id = req.params.id;

  // instantiate a new contact to edit
  let updatedContact = new Contact
  ({
    "_id": id,
    "FullName": req.body.fullName,
    "ContactNumber": req.body.contactNumber,
    "EmailAddress": req.body.emailAddress
  });

  // db.contacts.update({"_id":id}, update info...)
  Contact.updateOne({_id:id}, updatedContact, function(err: ErrorCallback)
  {
    if(err)
    {
      console.error(err);
      res.end(err);
    }

    // the edit was successful -> go back to the contact-list
    res.redirect('/contact-list');
  });  
});

/* Process the delete request */
router.get('/delete/:id', AuthGuard, function(req, res, next) 
{
  let id = req.params.id;

  // db.contacts.remove({"_id":id})
  Contact.remove({_id: id}, function(err)
  {
    if(err)
    {
      console.error(err);
      res.end(err);
    }

    // delete was successful -> go back to the contact-list
    res.redirect('/contact-list');
  });  
});


export default router;
