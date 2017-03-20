<?php

// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * External Web Service Template
 *
 * @package    local_graphfes
 * @copyright  2011 Moodle Pty Ltd (http://moodle.com)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
require_once($CFG->libdir . "/externallib.php");

class local_graphfes extends external_api {

    /**
     * Describes the parameters for get_forum.
     *
     * @return external_external_function_parameters
     * @since Moodle 2.5
     */
    public static function reportAll_parameters() {
        return new external_function_parameters (
            array(
                 'courseids' => new external_multiple_structure(
                    new external_value(PARAM_INT, 'course ID',VALUE_REQUIRED,NULL_NOT_ALLOWED), 'Array of Course IDs', VALUE_DEFAULT, array()),
            )
        );
    }

    /**
     * Returns a list of forums in a provided list of courses,
     * if no list is provided all forums that the user can view
     * will be returned.
     *
     * @param array $courseids the course ids
     * @return array the forum details
     * @since Moodle 2.5
     */
    public static function reportAll($courseids = array()) {
        global $DB;
        $params = self::validate_parameters(self::reportAll_parameters(), array('courseids' => $courseids));

        if (empty($params['courseids'])) {
            // Get all the courses the user can view.
            $courseids = array_keys(enrol_get_my_courses());
        } else {
            $courseids = $params['courseids'];
        }
        return $DB->get_records_sql("SELECT * FROM mdl_logstore_standard_log WHERE component='mod_forum' AND courseid=$courseids[0] ORDER BY mdl_logstore_standard_log.id DESC");
    }

    /**
     * Describes the get_forum return value.
     *
     * @return external_single_structure
     * @since Moodle 2.5
     */
     public static function reportAll_returns() {
        return new external_multiple_structure(
            new external_single_structure(
                array(                  
                    'courseid' => new external_value(PARAM_TEXT, 'Course id'),
                    'action' => new external_value(PARAM_TEXT, 'Course id'),
                    'userid' => new external_value(PARAM_TEXT, 'Course id'),
                    'other' => new external_value(PARAM_RAW, 'Course id'),
                    'objectid' => new external_value(PARAM_TEXT, 'Course id'),
                    'target' => new external_value(PARAM_TEXT, 'Course id'),
                    'timecreated' => new external_value(PARAM_INT, 'Course id'),
                ))
        );
    }





/**
     * Describes the parameters for get_forum.
     *
     * @return external_external_function_parameters
     * @since Moodle 2.5
     */
    public static function reportAllLegacy_parameters() {
        return new external_function_parameters (
            array(
                 'courseids' => new external_multiple_structure(
                    new external_value(PARAM_INT, 'course ID',VALUE_REQUIRED,NULL_NOT_ALLOWED), 'Array of Course IDs', VALUE_DEFAULT, array()),
            )
        );
    }

    /**
     * Returns a list of forums in a provided list of courses,
     * if no list is provided all forums that the user can view
     * will be returned.
     *
     * @param array $courseids the course ids
     * @return array the forum details
     * @since Moodle 2.5
     */
    public static function reportAllLegacy($courseids = array()) {
        global $DB;
        $params = self::validate_parameters(self::reportAllLegacy_parameters(), array('courseids' => $courseids));

        if (empty($params['courseids'])) {
            // Get all the courses the user can view.
            $courseids = array_keys(enrol_get_my_courses());
        } else {
            $courseids = $params['courseids'];
        }
        return $DB->get_records_sql("SELECT * FROM mdl_log WHERE module='forum' AND course=$courseids[0] ORDER BY mdl_log.id DESC");
    }

    /**
     * Describes the get_forum return value.
     *
     * @return external_single_structure
     * @since Moodle 2.5
     */
     public static function reportAllLegacy_returns() {
        return new external_multiple_structure(
            new external_single_structure(
                array(                  
                    'course' => new external_value(PARAM_TEXT, 'Course id'),
                    'action' => new external_value(PARAM_TEXT, 'Course id'),
                    'userid' => new external_value(PARAM_TEXT, 'Course id'),
                    'url' => new external_value(PARAM_TEXT, 'Course id'),
                    'cmid' => new external_value(PARAM_TEXT, 'Course id'),
                    'info' => new external_value(PARAM_TEXT, 'Course id'),
                    'time' => new external_value(PARAM_INT, 'Course id'),
                ))
        );
}
}
