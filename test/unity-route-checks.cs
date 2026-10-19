using System;
using System.Collections.Generic;
using System.Reflection;
using SchoolARNavigation;

static class UnityRouteChecks
{
    static void Require(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
    }

    static void Main()
    {
        Require(Attribute.IsDefined(typeof(SaveArNavigationRouteRequest), typeof(SerializableAttribute)), "Upload model is not serializable");
        var flags = BindingFlags.Static | BindingFlags.NonPublic;
        var validate = (Func<ArNavigationRouteDto, int, bool>)Delegate.CreateDelegate(
            typeof(Func<ArNavigationRouteDto, int, bool>), typeof(ARNavigationController).GetMethod("IsValidApiRoute", flags));
        var matches = (Func<ArNavigationRouteDto, int, SaveArNavigationRouteRequest, bool>)Delegate.CreateDelegate(
            typeof(Func<ArNavigationRouteDto, int, SaveArNavigationRouteRequest, bool>), typeof(ARNavigationController).GetMethod("RouteMatches", flags));
        var request = new SaveArNavigationRouteRequest {
            startAnchorCode = "MAIN_ENTRANCE", coordinateFrame = "marker-floor-v2", markerFloorOffsetMeters = 1.2f,
            points = new List<SaveArNavigationRoutePointRequest> {
                new SaveArNavigationRoutePointRequest {pointOrder = 0, pointType = "entrance", label = "Entrance"},
                new SaveArNavigationRoutePointRequest {pointOrder = 1, pointType = "destination", label = "Registrar", x = 3, z = 4}
            }
        };
        var response = new ArNavigationRouteDto {
            id = 1, roomId = 7, coordinateFrame = "marker-floor-v2", markerFloorOffsetMeters = 1.2f,
            startAnchor = new ArRouteAnchor {code = "MAIN_ENTRANCE"},
            points = new List<ArNavigationRoutePointDto> {
                new ArNavigationRoutePointDto {pointOrder = 0, pointType = "entrance", label = "Entrance"},
                new ArNavigationRoutePointDto {pointOrder = 1, pointType = "destination", label = "Registrar", x = 3, z = 4}
            }
        };
        Require(validate(response, 7) && matches(response, 7, request), "Valid server route was rejected");
        Require(!validate(response, 8), "A different room's route was accepted");
        response.coordinateFrame = null;
        Require(!validate(response, 7), "Legacy phone-relative route was accepted");
        response.coordinateFrame = "marker-floor-v2";
        response.points[1].x = 8;
        Require(!matches(response, 7, request), "Changed server points were accepted");
        response.points[1].x = 3;
        response.markerFloorOffsetMeters = 0.8f;
        Require(!matches(response, 7, request), "Changed marker floor height was accepted");
        response.markerFloorOffsetMeters = 1.2f;
        response.points[1].x = float.NaN;
        Require(!validate(response, 7), "Nonfinite route point was accepted");
        response.points[1].x = 3;
        response.points[0].x = 1;
        Require(!validate(response, 7), "Invalid entrance origin was accepted");
        Console.WriteLine("Unity route contract checks passed: serialization marker, shared frame, room identity, readback equality, height, finite coordinates, origin.");
    }
}
