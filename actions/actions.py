import sqlite3
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from typing import Any, Text, Dict, List

class ActionFetchSchemeDetails(Action):

    def name(self) -> Text:
        return "action_fetch_scheme_details"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Get the selected bullet ID from slot
        scheme_id = tracker.get_slot("bullet_selected")

        # Connect to SQLite database
        connection = sqlite3.connect('data/data.sqlite')
        cursor = connection.cursor()

        # Query the "Know a Scheme" table for scheme details based on scheme_id
        table_name = "Know a Scheme"
        try:
            query = f"SELECT Scheme_name, Scheme_details FROM [{table_name}] WHERE Scheme_id=?"
            cursor.execute(query, (scheme_id,))
            result = cursor.fetchone()

            # If a result is found, display it
            if result:
                scheme_name, details = result
                response = f"Here are the details of the scheme:\n{scheme_name}: {details}"
            else:
                response = "Sorry, I couldn't find details for that scheme."

            # Send the response back to the user
            dispatcher.utter_message(text=response)

        except sqlite3.Error as e:
            dispatcher.utter_message(text=f"An error occurred: {e}")

        # Close the database connection
        connection.close()

        return []

class ActionSubmitApplication(Action):

    def name(self) -> Text:
        return "action_submit_application"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Get the necessary information from slots
        scheme_id = tracker.get_slot("bullet_selected")
        scheme_name = None
        user_name = tracker.get_slot("name")
        user_pn = tracker.get_slot("phone_number")
        user_gpu = tracker.get_slot("GPU_location")

        # Connect to SQLite database
        connection = sqlite3.connect('data/data.sqlite')
        cursor = connection.cursor()

        # Retrieve the scheme name based on scheme_id from "Know a Scheme"
        try:
            cursor.execute("SELECT Scheme_name FROM [Know a Scheme] WHERE Scheme_id=?", (scheme_id,))
            scheme = cursor.fetchone()
            if scheme:
                scheme_name = scheme[0]
            else:
                dispatcher.utter_message(text="Sorry, I couldn't find the scheme you are trying to apply for.")
                connection.close()
                return []

            # Insert user application into "Apply a Scheme" table
            table_name = "Apply a Scheme"
            cursor.execute(f"INSERT INTO [{table_name}] (Scheme_id, Scheme_name, user_name, user_pn, user_gpu) VALUES (?, ?, ?, ?, ?)",
                           (scheme_id, scheme_name, user_name, user_pn, user_gpu))

            # Commit the transaction and close the connection
            connection.commit()
            response = f"Your application for scheme '{scheme_name}' has been successfully submitted. We will contact you at {user_pn} shortly."
            dispatcher.utter_message(text=response)

        except sqlite3.Error as e:
            dispatcher.utter_message(text=f"An error occurred while submitting your application: {e}")

        # Close the database connection
        connection.close()

        return []
    
class ActionGiveEmergencyContact(Action):
    def name(self) -> Text:
        return "action_give_emergency_contact"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Connect to SQLite database
        connection = sqlite3.connect('data.sqlite')
        cursor = connection.cursor()

        # Get the value of bullet_id from the slot
        bullet_id = tracker.get_slot("bullet_id")

        try:
            # Query to fetch contact details based on bullet_id
            cursor.execute("SELECT department_name, contact_details FROM [contactdetails] WHERE department_id = ?", (bullet_id,))
            result = cursor.fetchone()

            if result:
                department_name = result[0]
                contact_details = result[1]
                dispatcher.utter_message(text=f"Your request for {department_name} - Here are the contact details: {contact_details}")
            else:
                dispatcher.utter_message(text="Sorry, I couldn't find the contact information for the selected department.")
        except sqlite3.Error as e:
            dispatcher.utter_message(text=f"An error occurred while fetching contact details: {e}")
        finally:
            # Close the database connection
            connection.close()

        return []
    
class ActionSubmitDisasterForm(Action):
    def name(self) -> Text:
        return "action_submit_disaster_form"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Connect to SQLite database
        connection = sqlite3.connect('data.sqlite')
        cursor = connection.cursor()

        # Get the values of the slots
        disaster_type = tracker.get_slot("disaster_type")
        disaster_location = tracker.get_slot("disaster_location")
        contact_number = tracker.get_slot("phone_number")

        try:
            # Insert the values into the disaster table
            cursor.execute('''
                INSERT INTO [disaster] (disaster_type, disaster_location, contact_number)
                VALUES (?, ?, ?)
            ''', (disaster_type, disaster_location, contact_number))

            connection.commit()
            dispatcher.utter_message(text=f"Thank you for reporting the {disaster_type} at {disaster_location}. We will contact you at {contact_number} for further assistance.")
        except sqlite3.Error as e:
            dispatcher.utter_message(text=f"An error occurred while saving the disaster report: {e}")
        finally:
            # Close the database connection
            connection.close()

        return []