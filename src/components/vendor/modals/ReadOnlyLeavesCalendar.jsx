

// full working code
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  Container,
  Row,
  Col,
  Form,
  Button,
  Badge,
  Card,
  Modal,
  Image,
  Pagination,
} from "react-bootstrap";
import {
  FaCog,
  FaStar,
  FaPlus,
  FaPhone,
  FaArrowLeft,
  FaUserPlus,
  FaCalendarAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Calendar from "react-calendar";
import axios from "axios";
import vendor from "../../../assets/vendor.svg";
import "react-calendar/dist/Calendar.css";
import { BASE_URL } from "../../../utils/config";
import { useMemo } from "react";

const ReadOnlyLeavesCalendar = ({ markedLeaves = [] }) => {
  try {
    const leavesArr = useMemo(() => {
      try {
        const arr = Array.isArray(markedLeaves) ? markedLeaves : [];
        return [...new Set(arr.map(normalizeLeave))].sort(); // YYYY-MM-DD sorted
      } catch (e) {
        console.error("ReadOnlyLeavesCalendar leavesArr error:", e);
        return [];
      }
    }, [markedLeaves]);

    const leaveSet = useMemo(() => {
      try {
        return new Set(leavesArr);
      } catch (e) {
        console.error("ReadOnlyLeavesCalendar leaveSet error:", e);
        return new Set();
      }
    }, [leavesArr]);

    const [calMonth, setCalMonth] = useState(() => {
      try {
        const first = leavesArr[0];
        return first ? new Date(first + "T00:00:00") : new Date();
      } catch (e) {
        console.error("ReadOnlyLeavesCalendar init month error:", e);
        return new Date();
      }
    });

    // ✅ reset month when leaves change (member changed)
    useEffect(() => {
      try {
        const first = leavesArr[0];
        setCalMonth(first ? new Date(first + "T00:00:00") : new Date());
      } catch (e) {
        console.error("ReadOnlyLeavesCalendar reset month error:", e);
      }
    }, [leavesArr]);

    return (
      <div className="readonly-cal">
        <Calendar
          activeStartDate={calMonth}
          onActiveStartDateChange={({ activeStartDate }) => {
            try {
              if (activeStartDate) setCalMonth(activeStartDate);
            } catch (e) {
              console.error("ReadOnlyLeavesCalendar month change error:", e);
            }
          }}
          value={null}
          onChange={() => {}}
          selectRange={false}
          tileDisabled={() => true} // read-only dates (navigation still works)
          tileClassName={({ date, view }) => {
            try {
              if (view !== "month") return null;
              return leaveSet.has(dateKey(date)) ? "leave-day" : null;
            } catch (e) {
              console.error("ReadOnlyLeavesCalendar tileClassName error:", e);
              return null;
            }
          }}
        />
      </div>
    );
  } catch (e) {
    console.error("ReadOnlyLeavesCalendar render error:", e);
    return null;
  }
};

export default ReadOnlyLeavesCalendar