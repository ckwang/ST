from flask import Flask, request, render_template, redirect, url_for, flash, jsonify, g
from flaskext.login import (LoginManager, current_user, login_required,
                            login_user, logout_user, confirm_login, fresh_login_required, make_secure_token)
                            
from flaskext.oauth import OAuth
from model import *
import os
                    
app = Flask(__name__)

SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')#
#SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(os.path.dirname(__file__), "db", "database.db")
SECRET_KEY = "RandomSecretKey"
DEBUG = False
FACEBOOK_APP_ID = "460067924007727"
FACEBOOK_APP_SECRET = "dfc9a61d4cfb96e81628b12d0f7f761a"

app.config.from_object(__name__)
db.init_app(app)
app.test_request_context().push()
db.create_all()

# set up OAuth
oauth = OAuth()
facebook = oauth.remote_app("facebook",
	base_url="https://graph.facebook.com/",
	request_token_url=None,
	access_token_url="/oauth/access_token",
	authorize_url="https://www.facebook.com/dialog/oauth",
	consumer_key=FACEBOOK_APP_ID,
	consumer_secret=FACEBOOK_APP_SECRET,
	request_token_params={"scope": "email"}
)

# set up the login manager
login_manager = LoginManager()
login_manager.login_view = "login"
login_manager.refresh_view = "reauth"

@login_manager.user_loader
def load_user(id):
	return User.get_by_id(id)

@login_manager.token_loader
def load_token(token):
	return User.get_by_token(token)

login_manager.setup_app(app)

@app.route('/fb_login')
def fb_login():
    return facebook.authorize(callback=url_for('facebook_authorized',
        next=request.args.get('next') or request.referrer or None,
        _external=True))


@app.route('/login/authorized')
@facebook.authorized_handler
def facebook_authorized(resp):
    if resp is None:
        return 'Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        )
    session['oauth_token'] = (resp['access_token'], '')
    me = facebook.get('/me')
    return 'Logged in as id=%s name=%s redirect=%s' % \
        (me.data['id'], me.data['name'], request.args.get('next'))


@facebook.tokengetter
def get_facebook_oauth_token():
    return session.get('oauth_token')

# login
@app.route("/login", methods=["GET", "POST"])
def login():
	if request.method == "POST" and "username" in request.form:
		username = request.form["username"]
		password = request.form["password"]
		token = make_secure_token(username, password, key=app.config['SECRET_KEY'])
		user = User.get_by_token(token)
		
		if user:
			if login_user(user):
				return redirect(request.args.get("next") or url_for("showTrip"))
			else:
				flash(u"Sorry, but you could not log in.")
		else:
			flash(u"Invalid username and password.")
			
	return render_template("login.html")

# sign up
@app.route("/register/", methods=["GET", "POST"])
def register():
	if request.method == "POST":
		if "username" in request.form:
			username = request.form["username"]
			password = request.form["password"]
			
			if User.get_by_username(username):
				flash(u"Username already exists.")
			else:
				token = make_secure_token(username, password, key=SECRET_KEY)
				
				if User.get_by_token(token):
					flash(u"Please try other password.")			
				else:
					User.add_user(username, token)
					return login()
		else:
			flash(u"Invalid action.")
	
	return render_template("register.html")

# add admin
@app.route("/admin", methods=["GET"])
def admin():
	username = "admin"
	password = "BCHY"
	token = make_secure_token(username, password, key=SECRET_KEY)
	
	if not User.get_by_token(token):
		User.add_user(username, token)
		return login
		
	return render_template("register.html")

@app.route("/reauth/", methods=["GET", "POST"])
@login_required
def reauth():
	confirm_login()
	flash(u"Reauthenticated.")
	return redirect(url_for("mainPage"))

@app.route("/logout/")
@login_required
def logout():
	logout_user()
	return redirect(url_for("mainPage"))

@app.route("/getUserID", methods=["GET"])
@login_required
def getUserID():
	if "username" in request.args:
		username = request.args["username"]
		user = User.get_by_username(username)
		if user:
			return jsonify({"id": user.id})

	return jsonify({"id": 0})

@app.route("/trips/", methods=["GET"])
@app.route("/trips/<int:trip_id>/", methods=["GET"])
@login_required
def showTrip(trip_id=None):
	if trip_id:
		if getPermission(trip_id) > 0:
			return render_template("trip.html")
		else:
			flash(u"You cannot view the requested trip.")
	
# 	collaborators = [c for c in User.get_by_id(current_user.id).collaborators if c.permission > 0]
	
	return render_template("triplist.html")

@app.route("/trips/get", methods=["GET"])
@login_required
def getTrips():
	trips = [dict({"permission": c.permission}, **(c.trip.to_dict())) \
			for c in User.get_by_id(current_user.id).collaborators \
			if c.permission > 0]
	
	return jsonify({"trips": trips})

@app.route("/trips/new/", methods=["POST"])
@login_required
def newTrip():
	if "name" in request.form:
		name = request.form["name"]
		new_trip = Trip.add_trip(name, current_user.id)
		
		# add default event type
		EventType.add_event_type("Outdoor", new_trip.id)
		EventType.add_event_type("Dining", new_trip.id)
		EventType.add_event_type("Shopping", new_trip.id)
		EventType.add_event_type("Lodging", new_trip.id)
		
		return redirect(url_for("showTrip", trip_id = new_trip.id))
	else:
		flash(u"Invalid new form request.")
		return showTrip()

@app.route("/trips/delete/", methods=["POST"])
@login_required
def deleteTrip():
	trip_id = request.form["trip_id"]
	permission = getPermission(trip_id)
	if permission < 4:
		co = Collaborator.get_collaborator(trip_id, current_user.id)
		Collaborator.delete_by_id(co.id)
	else:
		Trip.delete_by_id(trip_id)
		
	return getTrips()

@app.route("/trips/<int:trip_id>/permission/", methods=["GET"])
@login_required
def getPermissionJson(trip_id):
	return jsonify({"permission": getPermission(trip_id)})

def getPermission(trip_id):
	if str(current_user.username) == "admin":
		return 1
	else:
		co = Collaborator.get_collaborator(trip_id, current_user.id)
		return co.permission if co else 0

@app.route("/trips/<int:trip_id>/collaborators/", methods=["GET"])
@login_required
def getCollaborators(trip_id):
	permission = getPermission(trip_id)
	if permission == 0:
		return jsonify({"permission": permission})
	else:
		collaborators = Trip.get_by_id(trip_id).collaborators
		results = [c.to_dict() for c in collaborators if c.permission > 0]
		
		return jsonify({"permission": permission, "collaborators": results})

@app.route("/trips/<int:trip_id>/collaborators/add", methods=["POST"])
@login_required
def addCollaborator(trip_id):
	if getPermission(trip_id) >= 3:
		co = Collaborator.get_collaborator(trip_id, request.form["user_id"])
		if co:
			Collaborator.update_collaborator(co.id, \
				int(request.form["permission"]))
		else:
			Collaborator.add_collaborator(trip_id, \
				request.form["user_id"], \
				int(request.form["permission"]))

	return getCollaborators(trip_id)

@app.route("/trips/<int:trip_id>/collaborators/update", methods=["POST"])
@login_required
def updateCollaborator(trip_id):
	if getPermission(trip_id) >= 3:
		Collaborator.update_collaborator(request.form["collaborator_id"], \
			int(request.form["permission"]))

	return getCollaborators(trip_id)
 
@app.route("/trips/<int:trip_id>/collaborators/delete", methods=["POST"])
@login_required
def deleteCollaborator(trip_id):
	if getPermission(trip_id) >= 3:
		Collaborator.delete_by_id(request.form["collaborator_id"])
	
	return getCollaborators(trip_id)

@app.route("/trips/<int:trip_id>/eventTypes/", methods=["GET"])
@login_required
def getEventTypes(trip_id):
	permission = getPermission(trip_id)
	if permission == 0:
		return jsonify({"permission": permission})
	else:
		eventTypes = Trip.get_by_id(trip_id).event_types
		result = [e.to_dict() for e in eventTypes]
		return jsonify({"permission": permission, "event_types": result})

@app.route("/trips/<int:trip_id>/eventTypes/add", methods=["POST"])
@login_required
def addEventTypes(trip_id):
	if getPermission(trip_id) >= 2:
		EventType.add_event_type(request.form["name"], trip_id)
	
	return getEventTypes(trip_id)

@app.route("/trips/<int:trip_id>/eventTypes/update", methods=["POST"])
@login_required
def updateEventTypes(trip_id):
	if getPermission(trip_id) >= 2:
		EventType.update_event_type(request_form["id"], request.form["name"])
		
	return getEventTypes(trip_id)

@app.route("/trips/<int:trip_id>/eventTypes/delete", methods=["POST"])
@login_required
def deleteEventTypes(trip_id):
	if getPermission(trip_id) >= 2:
		EventType.delete_by_id(request_form["id"])
		
	return getEventTypes(trip_id)

@app.route("/trips/<int:trip_id>/events/", methods=["GET"])
@login_required
def getEvents(trip_id):
	permission = getPermission(trip_id)
	if permission == 0:
		return jsonify({"permission": permission})
	else:
		trip = Trip.get_by_id(trip_id)
		events = trip.events
		results = [e.to_dict() for e in events]
		logs = trip.get_logs()
		
		return jsonify({"permission": permission, "events": results, "logs": logs})
		
@app.route("/trips/<int:trip_id>/events/add", methods=["POST"])
@login_required
def addEvent(trip_id):
	if getPermission(trip_id) >= 2:
		name = request.form["name"]
		type_id = request.form["type_id"]
		creator_id = Collaborator.get_collaborator(trip_id, current_user.id).id
		start_time = request.form["start_time"]
		end_time = request.form["end_time"]
		suggested_interval = request.form["suggested_interval"]
		is_arranged = request.form["is_arranged"]
		
		location_names = request.form.getlist("location_names[]")
		location_lats = request.form.getlist("location_lats[]")
		location_lngs = request.form.getlist("location_lngs[]")
		locations = zip(location_names, location_lats, location_lngs)
		
		Event.add_event(name, type_id, trip_id, creator_id, start_time, end_time, suggested_interval, is_arranged, locations)
	
	return getEvents(trip_id)

@app.route("/trips/<int:trip_id>/events/addWithType", methods=["POST"])
@login_required
def addEventWithType(trip_id):
	permission = getPermission(trip_id)
	if permission >= 2:
		event_type = EventType.add_event_type(request.form["type_name"], trip_id)
	
		name = request.form["name"]
		type_id = event_type.id
		creator_id = Collaborator.get_collaborator(trip_id, current_user.id).id
		start_time = request.form["start_time"]
		end_time = request.form["end_time"]
		suggested_interval = request.form["suggested_interval"]
		is_arranged = request.form["is_arranged"]
		
		location_names = request.form.getlist("location_names[]")
		location_lats = request.form.getlist("location_lats[]")
		location_lngs = request.form.getlist("location_lngs[]")
		locations = zip(location_names, location_lats, location_lngs)
		
		Event.add_event(name, type_id, trip_id, creator_id, start_time, end_time, suggested_interval, is_arranged, locations)
	
	if permission > 0:
		events = Trip.get_by_id(trip_id).events
		events_results = [e.to_dict() for e in events]
		eventTypes = Trip.get_by_id(trip_id).event_types
		eventTypes_result = [e.to_dict() for e in eventTypes]
		
		return jsonify({"permission": permission, "event_types": eventTypes_result, "events": events_results})
	else:
		return jsonify({"permission": permission})

@app.route("/trips/<int:trip_id>/events/delete", methods=["POST"])
@login_required
def deleteEvent(trip_id):
	if getPermission(trip_id) >= 2:
		event_id = request.form["event_id"]
		modifier_id = Collaborator.get_collaborator(trip_id, current_user.id).id
		
		Event.delete_by_id(modifier_id, event_id)
	
	return getEvents(trip_id)

@app.route("/trips/<int:trip_id>/events/update", methods=["POST"])
@login_required
def updateEvent(trip_id):
	if getPermission(trip_id) >= 2:
		event_id = request.form["id"]
		name = request.form["name"]
		type_id = request.form["type_id"]
		start_time = request.form["start_time"]
		end_time = request.form["end_time"]
		suggested_interval = request.form["suggested_interval"]
		is_arranged = request.form["is_arranged"]
		
		location_names = request.form.getlist("location_names[]")
		location_lats = request.form.getlist("location_lats[]")
		location_lngs = request.form.getlist("location_lngs[]")
		locations = zip(location_names, location_lats, location_lngs)
		
		modifier_id = Collaborator.get_collaborator(trip_id, current_user.id).id
		
		Event.update_event(modifier_id, event_id, name, type_id, start_time, end_time, suggested_interval, is_arranged, locations)
	
	return getEvents(trip_id)

@app.route("/trips/<int:trip_id>/events/updateTimes", methods=["POST"])
@login_required
def updateEventTimes(trip_id):
	if getPermission(trip_id) >= 2:
		event_ids = request.form.getlist("id[]")
		start_times = request.form.getlist("start_time[]")
		end_times = request.form.getlist("end_time[]")
		modifier_id = Collaborator.get_collaborator(trip_id, current_user.id).id
		
		Event.update_time(modifier_id, event_ids, start_times, end_times)
	
	return getEvents(trip_id)

	
@app.route("/trips/<int:trip_id>/events/updateWithType", methods=["POST"])
@login_required
def updateEventWithType(trip_id):
	permission = getPermission(trip_id)
	if permission >= 2:
		event_type = EventType.add_event_type(request.form["type_name"], trip_id)
		
		event_id = request.form["id"]
		name = request.form["name"]
		type_id = event_type.id
		start_time = request.form["start_time"]
		end_time = request.form["end_time"]
		suggested_interval = request.form["suggested_interval"]
		is_arranged = request.form["is_arranged"]
		
		location_names = request.form.getlist("location_names[]")
		location_lats = request.form.getlist("location_lats[]")
		location_lngs = request.form.getlist("location_lngs[]")
		locations = zip(location_names, location_lats, location_lngs)
		
		modifier_id = Collaborator.get_collaborator(trip_id, current_user.id).id
		
		Event.update_event(modifier_id, event_id, name, type_id, start_time, end_time, suggested_interval, is_arranged, locations)
	
	if permission > 0:
		events = Trip.get_by_id(trip_id).events
		events_results = [e.to_dict() for e in events]
		eventTypes = Trip.get_by_id(trip_id).event_types
		eventTypes_result = [e.to_dict() for e in eventTypes]
		
		return jsonify({"permission": permission, "event_types": eventTypes_result, "events": events_results})
	else:
		return jsonify({"permission": permission})

@app.route("/")
def mainPage():
	return redirect(url_for("showTrip"))

if __name__ == "__main__":
	port = int(os.environ.get('PORT', 5000))
	app.run(host='0.0.0.0', port=port)
    #app.run()

